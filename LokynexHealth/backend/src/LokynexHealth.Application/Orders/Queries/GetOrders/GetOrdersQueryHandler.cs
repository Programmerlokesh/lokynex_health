using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Orders.Queries.GetOrders;

public class GetOrdersQueryHandler : IRequestHandler<GetOrdersQuery, PagedResult<OrderDto>>
{
    private readonly IApplicationDbContext _db;

    public GetOrdersQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<OrderDto>> Handle(GetOrdersQuery request, CancellationToken cancellationToken)
    {
        // Base query — start from the most selective, indexed condition (is_deleted).
        // idx_orders_is_deleted exists in schema, so this filters fast before anything else runs.
        var query = _db.Orders
            .Include(o => o.Patient)
            .Include(o => o.Relative)
            .Include(o => o.Branch)
            .Include(o => o.Items)
            .Where(o => o.IsDeleted == request.ShowDeleted)
            .AsQueryable();

        // ---------- Filter chain: each .Where() narrows the SAME IQueryable, no DB hit yet ----------
        if (request.BranchId.HasValue)
            query = query.Where(o => o.BranchId == request.BranchId.Value);

        if (request.DoctorId.HasValue)
            query = query.Where(o => o.DoctorId == request.DoctorId.Value);

        if (request.ReferralId.HasValue)
            query = query.Where(o => o.ReferralId == request.ReferralId.Value);

        if (!string.IsNullOrWhiteSpace(request.OrderNumber))
            query = query.Where(o => EF.Functions.ILike(o.OrderNumber, $"%{request.OrderNumber}%"));

        if (!string.IsNullOrWhiteSpace(request.PatientPhone))
            query = query.Where(o => o.Patient.Phone == request.PatientPhone);

        if (!string.IsNullOrWhiteSpace(request.PatientNameContains))
        {
            var term = $"%{request.PatientNameContains}%";
            // Patient itself has no Name column — search matches the relative's name when present.
            query = query.Where(o => o.Relative != null && EF.Functions.ILike(o.Relative.Name, term));
        }

        if (!string.IsNullOrWhiteSpace(request.PaymentStatus) && request.PaymentStatus != "Any")
        {
            if (Enum.TryParse<PaymentStatusType>(request.PaymentStatus, out var statusEnum))
            {
                var statusText = statusEnum.ToString();
                query = query.Where(o => o.PaymentStatus.ToString() == statusText);
            }
        }

        if (request.DateFrom.HasValue)
        {
            var from = request.DateFrom.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(o => o.CreatedAt >= from);
        }
        if (request.DateTo.HasValue)
        {
            var to = request.DateTo.Value.ToDateTime(TimeOnly.MaxValue);
            query = query.Where(o => o.CreatedAt <= to);
        }

        // Test / Department / Technician filters touch OrderItems — use Any() (EXISTS subquery),
        // NOT a join, so we don't get duplicate Order rows when an order has multiple matching items.
        if (request.TestId.HasValue)
            query = query.Where(o => o.Items.Any(i => i.TestId == request.TestId.Value));

        if (request.DepartmentId.HasValue)
            query = query.Where(o => o.Items.Any(i => i.Test.DepartmentId == request.DepartmentId.Value));

        if (request.TechnicianId.HasValue)
            query = query.Where(o => o.Items.Any(i => i.TechnicianId == request.TechnicianId.Value));

        // ---------- Count AFTER filters, BEFORE pagination (Day 3 rule) ----------
        var totalCount = await query.CountAsync(cancellationToken);

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(o => new OrderDto
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                PatientName = o.Relative != null ? o.Relative.Name : o.Patient.Phone,
                PatientPhone = o.Patient.Phone,
                BranchId = o.BranchId,
                BranchName = o.Branch.BranchName,
                DoctorId = o.DoctorId,
                ReferralId = o.ReferralId,
                GrossAmount = o.GrossAmount,
                FinalAmount = o.FinalAmount,
                PaidAmount = o.PaidAmount,
                PaymentStatus = o.PaymentStatus.ToString(),
                PaymentMethod = o.PaymentMethod != null ? o.PaymentMethod.ToString() : null,
                IsComplimentary = o.IsComplimentary,
                IsDeleted = o.IsDeleted,
                TestCount = o.Items.Count,
                CreatedAt = o.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<OrderDto>
        {
            Items = orders,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}