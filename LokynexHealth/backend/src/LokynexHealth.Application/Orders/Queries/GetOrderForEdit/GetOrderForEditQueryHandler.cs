using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Orders.Queries.GetOrderForEdit;

public class GetOrderForEditQueryHandler : IRequestHandler<GetOrderForEditQuery, OrderEditDto>
{
    private readonly IApplicationDbContext _db;

    public GetOrderForEditQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<OrderEditDto> Handle(GetOrderForEditQuery request, CancellationToken ct)
    {
        var order = await _db.Orders.AsNoTracking().AsSplitQuery()
            .Include(o => o.Patient).ThenInclude(p => p.Relatives)
            .Include(o => o.Items).ThenInclude(i => i.Test).ThenInclude(t => t.Department)
            .Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(Order), request.Id);

        EditPartyDto? doctor = null;
        if (order.DoctorId.HasValue)
            doctor = await _db.Doctors.AsNoTracking().Where(d => d.Id == order.DoctorId.Value)
                .Select(d => new EditPartyDto { Id = d.Id, FullName = d.FullName, Phone = d.Phone, Address = d.Address, Email = d.Email, Specialization = d.Specialization })
                .FirstOrDefaultAsync(ct);

        EditPartyDto? referral = null;
        if (order.ReferralId.HasValue)
            referral = await _db.Referrals.AsNoTracking().Where(r => r.Id == order.ReferralId.Value)
                .Select(r => new EditPartyDto { Id = r.Id, FullName = r.FullName, Phone = r.Phone, Address = r.Address, Email = r.Email })
                .FirstOrDefaultAsync(ct);

        var p = order.Patient;
        return new OrderEditDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            IsDeleted = order.IsDeleted,
            Patient = new EditPatientDto
            {
                Id = p.Id,
                PatientCode = p.PatientCode,
                FullName = p.FullName,
                Phone = p.Phone,
                Age = p.Age,
                Gender = p.Gender?.ToString(),
                Address = p.Address,
                Email = p.Email,
                Relatives = p.Relatives.OrderBy(r => r.CreatedAt).Select(r => new EditRelativeDto
                {
                    Id = r.Id,
                    Name = r.Name,
                    Age = r.Age,
                    Gender = r.Gender?.ToString(),
                    Relationship = r.Relationship
                }).ToList()
            },
            RelativeId = order.RelativeId,
            BranchId = order.BranchId,
            Doctor = doctor,
            Referral = referral,
            DiscountType = order.DiscountType.ToString(),
            DiscountValue = order.DiscountValue,
            IsComplimentary = order.IsComplimentary,
            Items = order.Items.OrderBy(i => i.CreatedAt).ThenBy(i => i.Test.Name).Select(i => new EditLineDto
            {
                TestId = i.TestId,
                TestName = i.Test.Name,
                DepartmentId = i.Test.DepartmentId,
                DepartmentName = i.Test.Department?.Name ?? string.Empty,
                Price = i.Price,
                ReferralCommissionType = i.Test.ReferralCommissionType.ToString(),
                ReferralCommissionValue = i.Test.ReferralCommissionValue,
                TechnicianId = i.TechnicianId,
                DoctorCommissionEnabled = i.DoctorCommissionEnabled,
                ReferralCommissionEnabled = i.ReferralCommissionEnabled
            }).ToList(),
            Payments = order.Payments.GroupBy(x => x.PaymentMethod).Select(g => new EditPaymentDto
            {
                Method = g.Key.ToString(),
                Amount = g.Sum(x => x.Amount)
            }).ToList()
        };
    }
}