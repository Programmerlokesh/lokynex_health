using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Orders.Common;

public sealed class ComposedOrder
{
    public List<OrderItem> Items { get; init; } = new();
    public List<OrderPayment> Payments { get; init; } = new();
}

/// <summary>
/// The single place where an order form becomes an Order: patient find-or-create,
/// price + commission maths, discount, payments and payment status. Create and Update
/// both call it, so an edited order can never be priced differently from a new one.
/// Lookups are batched (one query per kind) and resolved through dictionaries: O(n) per order.
/// </summary>
public static class OrderComposer
{
    public static async Task<ComposedOrder> ApplyAsync(
        IApplicationDbContext db, OrderInput request, Order order, DateTimeOffset now, CancellationToken ct)
    {
        var phone = PhoneNormalizer.Normalize(request.PatientPhone);
        var rawPhone = request.PatientPhone.Trim();

        // ---------- Branch ----------
        if (!await db.Branches.AnyAsync(b => b.Id == request.BranchId, ct))
            throw new NotFoundException(nameof(Branch), request.BranchId);

        // ---------- Patient (guardian) ----------
        var patient = await db.Patients
            .Include(p => p.Relatives)
            .FirstOrDefaultAsync(p => p.Phone == phone || p.Phone == rawPhone, ct);

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
            db.Patients.Add(patient);
        }
        else
        {
            // Never overwrite a known guardian — only fill gaps.
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
                db.PatientRelatives.Add(relative);
            }
        }

        // ---------- Doctor / Referral ----------
        if (request.DoctorId.HasValue && !await db.Doctors.AnyAsync(d => d.Id == request.DoctorId.Value, ct))
            throw new NotFoundException(nameof(Doctor), request.DoctorId.Value);
        if (request.ReferralId.HasValue && !await db.Referrals.AnyAsync(r => r.Id == request.ReferralId.Value, ct))
            throw new NotFoundException(nameof(Referral), request.ReferralId.Value);

        // ---------- Tests ----------
        var testIds = request.Items.Select(i => i.TestId).Distinct().ToList();
        var tests = await db.Tests.Where(t => testIds.Contains(t.Id)).ToDictionaryAsync(t => t.Id, ct);
        if (tests.Count != testIds.Count)
            throw new NotFoundException(nameof(Test), testIds.First(id => !tests.ContainsKey(id)));

        // On EDIT, tests that were already on the order may have been deactivated since — keep them.
        var alreadyOnOrder = order.Items.Select(i => i.TestId).ToHashSet();
        var inactive = tests.Values.FirstOrDefault(t => t.Status != RecordStatus.Active && !alreadyOnOrder.Contains(t.Id));
        if (inactive is not null)
            throw new ConflictException($"Test '{inactive.Name}' is inactive and cannot be ordered.");

        // ---------- Technicians ----------
        var technicianIds = request.Items.Where(i => i.TechnicianId.HasValue)
            .Select(i => i.TechnicianId!.Value).Distinct().ToList();
        if (technicianIds.Count > 0)
        {
            var valid = (await db.Technicians.Where(t => technicianIds.Contains(t.Id)).Select(t => t.Id).ToListAsync(ct)).ToHashSet();
            var missing = technicianIds.FirstOrDefault(id => !valid.Contains(id));
            if (missing != Guid.Empty) throw new NotFoundException(nameof(Technician), missing);
        }

        // ---------- Person-specific commission overrides ----------
        var doctorOverrides = new Dictionary<Guid, CommissionOverride>();
        if (request.DoctorId.HasValue)
        {
            var id = request.DoctorId.Value;
            doctorOverrides = (await db.CommissionOverrides.Where(c => c.DoctorId == id && testIds.Contains(c.TestId)).ToListAsync(ct))
                .ToDictionary(c => c.TestId);
        }
        var referralOverrides = new Dictionary<Guid, CommissionOverride>();
        if (request.ReferralId.HasValue)
        {
            var id = request.ReferralId.Value;
            referralOverrides = (await db.CommissionOverrides.Where(c => c.ReferralId == id && testIds.Contains(c.TestId)).ToListAsync(ct))
                .ToDictionary(c => c.TestId);
        }
        var technicianOverrides = new Dictionary<(Guid, Guid), CommissionOverride>();
        if (technicianIds.Count > 0)
        {
            technicianOverrides = (await db.CommissionOverrides
                    .Where(c => c.TechnicianId != null && technicianIds.Contains(c.TechnicianId.Value) && testIds.Contains(c.TestId))
                    .ToListAsync(ct))
                .ToDictionary(c => (c.TechnicianId!.Value, c.TestId));
        }

        // ---------- Order scalars ----------
        order.PatientId = patient.Id;
        order.RelativeId = relative?.Id;
        order.BranchId = request.BranchId;
        order.DoctorId = request.DoctorId;
        order.ReferralId = request.ReferralId;
        order.DiscountType = Enum.Parse<DiscountType>(request.DiscountType, ignoreCase: true);
        order.DiscountValue = request.DiscountValue;
        order.IsComplimentary = request.IsComplimentary;

        // ---------- Lines ----------
        // A test already on the order keeps the price it was billed at (order_items.price is a snapshot).
        var billedPrice = order.Items.ToDictionary(i => i.TestId, i => i.Price);

        decimal gross = 0;
        var orderItems = new List<OrderItem>(request.Items.Count);

        foreach (var input in request.Items)
        {
            var test = tests[input.TestId];
            var price = billedPrice.TryGetValue(test.Id, out var billed) ? billed : test.Price;
            gross += price;

            // A referral REPLACES the doctor commission.
            var referralEnabled = input.ReferralCommissionEnabled && request.ReferralId.HasValue;
            var doctorEnabled = input.DoctorCommissionEnabled && request.DoctorId.HasValue && !request.ReferralId.HasValue;

            decimal doctorAmount = 0, referralAmount = 0, technicianAmount = 0;
            if (!request.IsComplimentary)
            {
                if (doctorEnabled)
                    doctorAmount = doctorOverrides.TryGetValue(test.Id, out var dOv)
                        ? CommissionCalculator.Calculate(dOv.CommissionType, dOv.CommissionValue, price)
                        : CommissionCalculator.Calculate(test.DoctorCommissionType, test.DoctorCommissionValue, price);

                if (referralEnabled)
                    referralAmount = referralOverrides.TryGetValue(test.Id, out var rOv)
                        ? CommissionCalculator.Calculate(rOv.CommissionType, rOv.CommissionValue, price)
                        : CommissionCalculator.Calculate(test.ReferralCommissionType, test.ReferralCommissionValue, price);

                if (input.TechnicianId.HasValue)
                    technicianAmount = technicianOverrides.TryGetValue((input.TechnicianId.Value, test.Id), out var tOv)
                        ? CommissionCalculator.Calculate(tOv.CommissionType, tOv.CommissionValue, price)
                        : CommissionCalculator.Calculate(test.TechnicianCommissionType, test.TechnicianCommissionValue, price);
            }

            orderItems.Add(new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                TestId = test.Id,
                Price = price,
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

        // ---------- Payments: merged by method ----------
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
                payments.Add(new OrderPayment { Id = Guid.NewGuid(), OrderId = order.Id, Amount = amount, PaymentMethod = method, PaidAt = now });
        }

        order.PaidAmount = payments.Sum(p => p.Amount);
        if (order.PaidAmount > order.FinalAmount)
            throw new ConflictException("Paid amount cannot be more than the payable total.");

        order.PaymentMethod = payments.Count == 0 ? null : payments.OrderByDescending(p => p.Amount).First().PaymentMethod;
        order.PaymentStatus = order.IsComplimentary || order.PaidAmount >= order.FinalAmount
            ? PaymentStatusType.Paid
            : order.PaidAmount > 0 ? PaymentStatusType.Partial : PaymentStatusType.Open;

        return new ComposedOrder { Items = orderItems, Payments = payments };
    }

    private static TEnum? ParseNullableEnum<TEnum>(string? value) where TEnum : struct, Enum =>
        !string.IsNullOrWhiteSpace(value) && Enum.TryParse<TEnum>(value, true, out var result) ? result : null;
}