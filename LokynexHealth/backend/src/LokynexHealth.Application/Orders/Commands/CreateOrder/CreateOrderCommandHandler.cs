using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Orders.Commands.CreateOrder;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public CreateOrderCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var phone = PhoneNormalizer.Normalize(request.PatientPhone);
        var rawPhone = request.PatientPhone.Trim(); // older rows may hold the number as typed

        // ---------- Branch ----------
        var branchOk = await _db.Branches.AnyAsync(b => b.Id == request.BranchId, cancellationToken);
        if (!branchOk) throw new NotFoundException(nameof(Branch), request.BranchId);

        // ---------- Patient (guardian) : indexed lookup by phone ----------
        var patient = await _db.Patients
            .Include(p => p.Relatives)
            .FirstOrDefaultAsync(p => p.Phone == phone || p.Phone == rawPhone, cancellationToken);

        if (patient is null)
        {
            if (string.IsNullOrWhiteSpace(request.PatientName))
                throw new ConflictException("Patient name is required for a new patient.");

            patient = new Patient
            {
                Id = Guid.NewGuid(),
                PatientCode = "PT" + Guid.NewGuid().ToString("N")[..8].ToUpper(),
                FullName = request.PatientName.Trim(),
                Phone = phone,
                Age = request.PatientAge,
                Gender = ParseNullableEnum<GenderType>(request.PatientGender),
                Address = request.PatientAddress?.Trim(),
                Email = request.PatientEmail,
                WhatsappNumber = request.PatientWhatsapp ?? phone,
                CreatedAt = now
            };
            _db.Patients.Add(patient);
        }
        else
        {
            // Never overwrite a known guardian — only fill gaps (legacy rows have no name/address).
            if (string.IsNullOrWhiteSpace(patient.FullName) && !string.IsNullOrWhiteSpace(request.PatientName))
                patient.FullName = request.PatientName.Trim();
            if (string.IsNullOrWhiteSpace(patient.Address) && !string.IsNullOrWhiteSpace(request.PatientAddress))
                patient.Address = request.PatientAddress.Trim();
            patient.Age ??= request.PatientAge;
            patient.Gender ??= ParseNullableEnum<GenderType>(request.PatientGender);
        }

        // ---------- Relative (family member) ----------
        PatientRelative? relative = null;

        if (request.RelativeId.HasValue)
        {
            relative = patient.Relatives.FirstOrDefault(r => r.Id == request.RelativeId.Value)
                       ?? throw new NotFoundException(nameof(PatientRelative), request.RelativeId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(request.RelativeName))
        {
            var name = request.RelativeName.Trim();
            var relation = request.RelativeRelationship?.Trim();

            // De-duplicate on (name, relation) so re-adding "Rina / Wife" reuses the same person.
            relative = patient.Relatives.FirstOrDefault(r =>
                string.Equals(r.Name, name, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(r.Relationship ?? string.Empty, relation ?? string.Empty, StringComparison.OrdinalIgnoreCase));

            if (relative is null)
            {
                relative = new PatientRelative
                {
                    Id = Guid.NewGuid(),
                    PatientId = patient.Id,
                    Name = name,
                    Age = request.RelativeAge,
                    Relationship = relation,
                    Gender = ParseNullableEnum<GenderType>(request.RelativeGender),
                    CreatedAt = now
                };
                _db.PatientRelatives.Add(relative);
            }
        }

        // ---------- Doctor / Referral ----------
        if (request.DoctorId.HasValue &&
            !await _db.Doctors.AnyAsync(d => d.Id == request.DoctorId.Value, cancellationToken))
            throw new NotFoundException(nameof(Doctor), request.DoctorId.Value);

        if (request.ReferralId.HasValue &&
            !await _db.Referrals.AnyAsync(r => r.Id == request.ReferralId.Value, cancellationToken))
            throw new NotFoundException(nameof(Referral), request.ReferralId.Value);

        // ---------- Tests (one query -> Dictionary, O(1) per line) ----------
        var testIds = request.Items.Select(i => i.TestId).Distinct().ToList();
        var tests = await _db.Tests
            .Where(t => testIds.Contains(t.Id))
            .ToDictionaryAsync(t => t.Id, cancellationToken);

        if (tests.Count != testIds.Count)
            throw new NotFoundException(nameof(Test), testIds.First(id => !tests.ContainsKey(id)));

        var inactive = tests.Values.FirstOrDefault(t => t.Status != RecordStatus.Active);
        if (inactive is not null)
            throw new ConflictException($"Test '{inactive.Name}' is inactive and cannot be ordered.");

        // ---------- Technicians ----------
        var technicianIds = request.Items
            .Where(i => i.TechnicianId.HasValue)
            .Select(i => i.TechnicianId!.Value)
            .Distinct()
            .ToList();

        if (technicianIds.Count > 0)
        {
            var valid = (await _db.Technicians
                    .Where(t => technicianIds.Contains(t.Id))
                    .Select(t => t.Id)
                    .ToListAsync(cancellationToken))
                .ToHashSet();

            var missing = technicianIds.FirstOrDefault(id => !valid.Contains(id));
            if (missing != Guid.Empty) throw new NotFoundException(nameof(Technician), missing);
        }

        // ---------- Person-specific commissions (Commission Setup / per-test list) ----------
        // A commission set for THIS doctor / referral / technician on a test beats the
        // test's own default. One query per kind, then O(1) dictionary lookups per line.
        var doctorOverrides = new Dictionary<Guid, CommissionOverride>();
        if (request.DoctorId.HasValue)
        {
            var doctorId = request.DoctorId.Value;
            doctorOverrides = (await _db.CommissionOverrides
                    .Where(c => c.DoctorId == doctorId && testIds.Contains(c.TestId))
                    .ToListAsync(cancellationToken))
                .ToDictionary(c => c.TestId);
        }

        var referralOverrides = new Dictionary<Guid, CommissionOverride>();
        if (request.ReferralId.HasValue)
        {
            var referralId = request.ReferralId.Value;
            referralOverrides = (await _db.CommissionOverrides
                    .Where(c => c.ReferralId == referralId && testIds.Contains(c.TestId))
                    .ToListAsync(cancellationToken))
                .ToDictionary(c => c.TestId);
        }

        var technicianOverrides = new Dictionary<(Guid TechnicianId, Guid TestId), CommissionOverride>();
        if (technicianIds.Count > 0)
        {
            technicianOverrides = (await _db.CommissionOverrides
                    .Where(c => c.TechnicianId != null && technicianIds.Contains(c.TechnicianId.Value) && testIds.Contains(c.TestId))
                    .ToListAsync(cancellationToken))
                .ToDictionary(c => (c.TechnicianId!.Value, c.TestId));
        }

        // ---------- Order + lines ----------
        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = null!,
            PatientId = patient.Id,
            RelativeId = relative?.Id,
            BranchId = request.BranchId,
            DoctorId = request.DoctorId,
            ReferralId = request.ReferralId,
            DiscountType = Enum.Parse<DiscountType>(request.DiscountType, ignoreCase: true),
            DiscountValue = request.DiscountValue,
            IsComplimentary = request.IsComplimentary,
            CreatedBy = Guid.Empty,
            CreatedAt = now
        };

        decimal gross = 0;
        var orderItems = new List<OrderItem>(request.Items.Count);

        foreach (var input in request.Items)
        {
            var test = tests[input.TestId];
            gross += test.Price;

            // A referral REPLACES the doctor commission: with a referral on the
            // order the doctor is never paid, whatever the client sent.
            var referralEnabled = input.ReferralCommissionEnabled && request.ReferralId.HasValue;
            var doctorEnabled = input.DoctorCommissionEnabled && request.DoctorId.HasValue && !request.ReferralId.HasValue;

            decimal doctorAmount = 0, referralAmount = 0, technicianAmount = 0;
            if (!request.IsComplimentary)
            {
                if (doctorEnabled)
                {
                    doctorAmount = doctorOverrides.TryGetValue(test.Id, out var dOv)
                        ? CommissionCalculator.Calculate(dOv.CommissionType, dOv.CommissionValue, test.Price)
                        : CommissionCalculator.Calculate(test.DoctorCommissionType, test.DoctorCommissionValue, test.Price);
                }

                if (referralEnabled)
                {
                    referralAmount = referralOverrides.TryGetValue(test.Id, out var rOv)
                        ? CommissionCalculator.Calculate(rOv.CommissionType, rOv.CommissionValue, test.Price)
                        : CommissionCalculator.Calculate(test.ReferralCommissionType, test.ReferralCommissionValue, test.Price);
                }

                // Technician is OPTIONAL: no technician picked on the line => no technician commission.
                if (input.TechnicianId.HasValue)
                {
                    technicianAmount = technicianOverrides.TryGetValue((input.TechnicianId.Value, test.Id), out var tOv)
                        ? CommissionCalculator.Calculate(tOv.CommissionType, tOv.CommissionValue, test.Price)
                        : CommissionCalculator.Calculate(test.TechnicianCommissionType, test.TechnicianCommissionValue, test.Price);
                }
            }

            orderItems.Add(new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                TestId = test.Id,
                Price = test.Price,
                TechnicianId = input.TechnicianId,
                DoctorCommissionEnabled = doctorEnabled,
                DoctorCommissionAmount = doctorAmount,
                ReferralCommissionEnabled = referralEnabled,
                ReferralCommissionAmount = referralAmount,
                TechnicianCommissionAmount = technicianAmount,
                CreatedAt = now
            });
        }

        order.GrossAmount = gross;

        if (request.IsComplimentary)
        {
            order.FinalAmount = 0;
        }
        else
        {
            var discount = order.DiscountType == DiscountType.Percentage
                ? Math.Round(gross * (request.DiscountValue / 100m), 2, MidpointRounding.AwayFromZero)
                : request.DiscountValue;

            order.FinalAmount = Math.Max(0, gross - discount);
        }

        // ---------- Payments: merge by method (Dictionary) ----------
        var payments = new List<OrderPayment>();
        if (!request.IsComplimentary)
        {
            var byMethod = new Dictionary<PaymentMethodType, decimal>();

            if (request.Payments.Count > 0)
            {
                foreach (var p in request.Payments)
                {
                    var method = Enum.Parse<PaymentMethodType>(p.Method, ignoreCase: true);
                    byMethod[method] = byMethod.GetValueOrDefault(method) + p.Amount;
                }
            }
            else if (request.PaidAmount > 0)
            {
                var method = ParseNullableEnum<PaymentMethodType>(request.PaymentMethod) ?? PaymentMethodType.Cash;
                byMethod[method] = request.PaidAmount;
            }

            foreach (var (method, amount) in byMethod)
            {
                payments.Add(new OrderPayment
                {
                    Id = Guid.NewGuid(),
                    OrderId = order.Id,
                    Amount = amount,
                    PaymentMethod = method,
                    PaidAt = now
                });
            }
        }

        order.PaidAmount = payments.Sum(p => p.Amount);
        if (order.PaidAmount > order.FinalAmount)
            throw new ConflictException("Paid amount cannot be more than the payable total.");

        order.PaymentMethod = payments.Count == 0
            ? null
            : payments.OrderByDescending(p => p.Amount).First().PaymentMethod;

        order.PaymentStatus = order.IsComplimentary || order.PaidAmount >= order.FinalAmount
            ? PaymentStatusType.Paid
            : order.PaidAmount > 0 ? PaymentStatusType.Partial : PaymentStatusType.Open;

        _db.Orders.Add(order);
        _db.OrderItems.AddRange(orderItems);
        _db.OrderPayments.AddRange(payments);

        await _db.SaveChangesAsync(cancellationToken);
        return order.Id;
    }

    private static TEnum? ParseNullableEnum<TEnum>(string? value) where TEnum : struct, Enum =>
        !string.IsNullOrWhiteSpace(value) && Enum.TryParse<TEnum>(value, true, out var result) ? result : null;
}