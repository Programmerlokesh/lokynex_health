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

    public CreateOrderCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Guid> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var patient = await _db.Patients
            .FirstOrDefaultAsync(p => p.Phone == request.PatientPhone, cancellationToken);

        if (patient is null)
        {
            patient = new Patient
            {
                Id = Guid.NewGuid(),
                PatientCode = "PT" + Guid.NewGuid().ToString("N")[..8].ToUpper(),
                Phone = request.PatientPhone,
                Age = request.PatientAge,
                Gender = ParseNullableEnum<GenderType>(request.PatientGender),
                Address = request.PatientAddress,
                Email = request.PatientEmail,
                WhatsappNumber = request.PatientWhatsapp ?? request.PatientPhone,
                CreatedAt = DateTimeOffset.UtcNow
            };
            _db.Patients.Add(patient);
        }

        PatientRelative? relative = null;
        if (!string.IsNullOrWhiteSpace(request.RelativeName))
        {
            relative = new PatientRelative
            {
                Id = Guid.NewGuid(),
                PatientId = patient.Id,
                Name = request.RelativeName,
                Age = request.RelativeAge,
                Relationship = request.RelativeRelationship,
                Gender = ParseNullableEnum<GenderType>(request.RelativeGender),
                CreatedAt = DateTimeOffset.UtcNow
            };
            _db.PatientRelatives.Add(relative);
        }

        if (request.DoctorId.HasValue)
        {
            var doctorExists = await _db.Doctors.AnyAsync(d => d.Id == request.DoctorId.Value, cancellationToken);
            if (!doctorExists) throw new NotFoundException(nameof(Doctor), request.DoctorId.Value);
        }
        if (request.ReferralId.HasValue)
        {
            var referralExists = await _db.Referrals.AnyAsync(r => r.Id == request.ReferralId.Value, cancellationToken);
            if (!referralExists) throw new NotFoundException(nameof(Referral), request.ReferralId.Value);
        }

        var testIds = request.Items.Select(i => i.TestId).Distinct().ToList();

        var tests = await _db.Tests
            .Where(t => testIds.Contains(t.Id))
            .ToDictionaryAsync(t => t.Id, cancellationToken);

        if (tests.Count != testIds.Count)
        {
            var missingId = testIds.First(id => !tests.ContainsKey(id));
            throw new NotFoundException(nameof(Test), missingId);
        }

        var technicianIds = request.Items
            .Where(i => i.TechnicianId.HasValue)
            .Select(i => i.TechnicianId!.Value)
            .Distinct()
            .ToList();

        var validTechnicianIds = technicianIds.Count == 0
            ? new HashSet<Guid>()
            : (await _db.Technicians
                .Where(t => technicianIds.Contains(t.Id))
                .Select(t => t.Id)
                .ToListAsync(cancellationToken))
              .ToHashSet();

        if (validTechnicianIds.Count != technicianIds.Count)
        {
            var missingId = technicianIds.First(id => !validTechnicianIds.Contains(id));
            throw new NotFoundException(nameof(Technician), missingId);
        }

        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = null!,
            PatientId = patient.Id,
            RelativeId = relative?.Id,
            BranchId = request.BranchId,
            DoctorId = request.DoctorId,
            ReferralId = request.ReferralId,
            DiscountType = Enum.Parse<DiscountType>(request.DiscountType),
            DiscountValue = request.DiscountValue,
            IsComplimentary = request.IsComplimentary,
            PaymentMethod = ParseNullableEnum<PaymentMethodType>(request.PaymentMethod),
            PaidAmount = request.PaidAmount,
            CreatedBy = Guid.Empty,
            CreatedAt = DateTimeOffset.UtcNow
        };

        decimal grossAmount = 0;
        var orderItems = new List<OrderItem>(request.Items.Count);

        foreach (var itemInput in request.Items)
        {
            var test = tests[itemInput.TestId];
            grossAmount += test.Price;

            var doctorEnabled = itemInput.DoctorCommissionEnabled && request.DoctorId.HasValue;
            var referralEnabled = itemInput.ReferralCommissionEnabled && request.ReferralId.HasValue;

            decimal doctorAmount = 0, referralAmount = 0, technicianAmount = 0;

            if (!request.IsComplimentary)
            {
                if (doctorEnabled)
                    doctorAmount = CalculateCommission(test.DoctorCommissionType, test.DoctorCommissionValue, test.Price);

                if (referralEnabled)
                    referralAmount = CalculateCommission(test.ReferralCommissionType, test.ReferralCommissionValue, test.Price);

                if (itemInput.TechnicianId.HasValue)
                    technicianAmount = CalculateCommission(test.TechnicianCommissionType, test.TechnicianCommissionValue, test.Price);
            }

            orderItems.Add(new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                TestId = test.Id,
                Price = test.Price,
                TechnicianId = itemInput.TechnicianId,
                DoctorCommissionEnabled = doctorEnabled,
                DoctorCommissionAmount = doctorAmount,
                ReferralCommissionEnabled = referralEnabled,
                ReferralCommissionAmount = referralAmount,
                TechnicianCommissionAmount = technicianAmount,
                CreatedAt = DateTimeOffset.UtcNow
            });
        }

        order.GrossAmount = grossAmount;

        if (request.IsComplimentary)
        {
            order.FinalAmount = 0;
            order.PaidAmount = 0;
        }
        else
        {
            var discountAmount = order.DiscountType == DiscountType.Percentage
                ? grossAmount * (request.DiscountValue / 100m)
                : request.DiscountValue;

            order.FinalAmount = Math.Max(0, grossAmount - discountAmount);
        }

        order.PaymentStatus = order.IsComplimentary || order.PaidAmount >= order.FinalAmount
            ? PaymentStatusType.Paid
            : order.PaidAmount > 0
                ? PaymentStatusType.Partial
                : PaymentStatusType.Open;

        _db.Orders.Add(order);
        foreach (var item in orderItems)
            _db.OrderItems.Add(item);

        await _db.SaveChangesAsync(cancellationToken);

        return order.Id;
    }

    private static decimal CalculateCommission(CommissionType type, decimal value, decimal testPrice) =>
        type == CommissionType.Percentage ? testPrice * (value / 100m) : value;

    private static TEnum? ParseNullableEnum<TEnum>(string? value) where TEnum : struct, Enum =>
        !string.IsNullOrWhiteSpace(value) && Enum.TryParse<TEnum>(value, out var result) ? result : null;
}