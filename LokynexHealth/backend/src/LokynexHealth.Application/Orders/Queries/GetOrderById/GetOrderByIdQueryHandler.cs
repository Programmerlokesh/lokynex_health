using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Orders.Common;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Orders.Queries.GetOrderById;

public class GetOrderByIdQueryHandler : IRequestHandler<GetOrderByIdQuery, OrderInvoiceDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetOrderByIdQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<OrderInvoiceDto> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var order = await _db.Orders
            .AsNoTracking()
            .AsSplitQuery()
            .Include(o => o.Patient)
            .Include(o => o.Relative)
            .Include(o => o.Branch)
            .Include(o => o.Items).ThenInclude(i => i.Test).ThenInclude(t => t.Department)
            .Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Order), request.Id);

        // Doctor / referral live in the platform schema (no navigation) — fetch each by key.
        OrderPartyDto? doctor = null;
        if (order.DoctorId.HasValue)
        {
            doctor = await _db.Doctors.AsNoTracking()
                .Where(d => d.Id == order.DoctorId.Value)
                .Select(d => new OrderPartyDto { Id = d.Id, Name = d.FullName, Phone = d.Phone, Address = d.Address })
                .FirstOrDefaultAsync(cancellationToken);
        }

        OrderPartyDto? referral = null;
        if (order.ReferralId.HasValue)
        {
            referral = await _db.Referrals.AsNoTracking()
                .Where(r => r.Id == order.ReferralId.Value)
                .Select(r => new OrderPartyDto { Id = r.Id, Name = r.FullName, Phone = r.Phone, Address = r.Address })
                .FirstOrDefaultAsync(cancellationToken);
        }

        // Company = the tenant behind this token. Older tokens carry no tenant_id,
        // so fall back to the oldest tenant (single-lab deployments).
        var tenantId = _currentUser.TenantId;
        var tenant = tenantId.HasValue
            ? await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tenantId.Value, cancellationToken)
            : await _db.Tenants.AsNoTracking().OrderBy(t => t.CreatedAt).FirstOrDefaultAsync(cancellationToken);

        // ---- Lines: order-level discount spread proportionally, exact to the paisa ----
        var items = order.Items.OrderBy(i => i.CreatedAt).ThenBy(i => i.Test.Name).ToList();
        var gross = items.Sum(i => i.Price);

        decimal discount = order.IsComplimentary
            ? gross
            : Math.Clamp(gross - order.FinalAmount, 0m, gross);

        var shares = DiscountAllocator.Allocate(items.Select(i => i.Price).ToList(), discount);

        var lines = items.Select((i, idx) => new OrderInvoiceLineDto
        {
            TestId = i.TestId,
            Description = i.Test.Name,
            DepartmentName = i.Test.Department?.Name ?? string.Empty,
            Rate = i.Price,
            Less = shares[idx],
            Amount = i.Price - shares[idx]
        }).ToList();

        var payments = order.Payments
            .OrderBy(p => p.PaidAt)
            .Select(p => new OrderInvoicePaymentDto
            {
                Method = p.PaymentMethod.ToString(),
                Amount = p.Amount,
                PaidAt = p.PaidAt
            }).ToList();

        var paymentMode = payments.Count > 0
            ? string.Join(" + ", payments.Select(p => p.Method).Distinct())
            : order.IsComplimentary ? "Complimentary" : "Unpaid";

        var history = await _db.OrderAuditLogs.AsNoTracking()
            .Where(a => a.OrderId == order.Id)
            .OrderByDescending(a => a.ChangedAt)
            .Select(a => new OrderAuditEntryDto
            {
                Action = a.Action,
                ChangedByName = a.ChangedByName,
                ChangedAt = a.ChangedAt,
                Summary = a.ChangeSummary
            })
            .ToListAsync(cancellationToken);

        var person = order.Relative;
        var digits = new string(order.OrderNumber.Where(char.IsDigit).ToArray());
        var invoiceNo = digits.Length > 0 ? $"INV-{digits.PadLeft(6, '0')}" : order.OrderNumber;

        return new OrderInvoiceDto
        {
            Id = order.Id,
            CompanyName = tenant?.PrimaryBranchName ?? order.Branch.BranchName,
            CompanyType = tenant?.CompanyType ?? "Diagnostic Laboratory",
            BranchName = order.Branch.BranchName,
            BranchAddress = order.Branch.BranchAddress,
            BranchPhone = order.Branch.BranchPhone,
            InvoiceNo = invoiceNo,
            BillNo = order.OrderNumber,
            BillDate = order.CreatedAt,
            PaymentMode = paymentMode,
            PatientName = person?.Name ?? order.Patient.FullName,
            PatientAge = person is not null ? person.Age : order.Patient.Age,
            PatientGender = (person is not null ? person.Gender : order.Patient.Gender)?.ToString(),
            PatientPhone = order.Patient.Phone,
            PatientAddress = order.Patient.Address,
            GuardianName = order.Patient.FullName,
            Relationship = person?.Relationship,
            Doctor = doctor,
            Referral = referral,
            Subtotal = gross,
            Discount = discount,
            Total = order.FinalAmount,
            Paid = order.PaidAmount,
            Due = Math.Max(0, order.FinalAmount - order.PaidAmount),
            PaymentStatus = order.PaymentStatus.ToString(),
            IsComplimentary = order.IsComplimentary,
            Lines = lines,
            Payments = payments,
            CreatedByName = order.CreatedByName,
            CreatedAt = order.CreatedAt,
            UpdatedByName = order.UpdatedByName,
            UpdatedAt = order.UpdatedAt,
            IsDeleted = order.IsDeleted,
            DeletedByName = order.DeletedByName,
            DeletedAt = order.DeletedAt,
            History = history
        };
    }
}