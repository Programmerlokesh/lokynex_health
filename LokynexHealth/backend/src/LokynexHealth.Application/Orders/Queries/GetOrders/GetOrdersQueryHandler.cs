using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Orders.Queries.GetOrders;

public class GetOrdersQueryHandler : IRequestHandler<GetOrdersQuery, PagedResult<OrderDto>>
{
    private readonly IApplicationDbContext _db;

    public GetOrdersQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<PagedResult<OrderDto>> Handle(GetOrdersQuery request, CancellationToken ct)
    {
        var page = Math.Max(1, request.PageNumber);
        var size = Math.Clamp(request.PageSize, 1, 100);

        // One IQueryable: every filter narrows it, nothing hits the DB until Count/ToList.
        var query = request.Apply(_db.Orders.AsNoTracking());

        var total = await query.CountAsync(ct);

        // Deleted List: latest deletion first. Id breaks ties so pages never overlap.
        var ordered = request.ShowDeleted
            ? query.OrderByDescending(o => o.DeletedAt).ThenByDescending(o => o.Id)
            : query.OrderByDescending(o => o.CreatedAt).ThenByDescending(o => o.Id);

        var rows = await ordered
            .Skip((page - 1) * size)
            .Take(size)
            .Select(o => new OrderDto
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                PatientName = o.Relative != null ? o.Relative.Name : (o.Patient.FullName != "" ? o.Patient.FullName : o.Patient.Phone),
                PatientPhone = o.Patient.Phone,
                BranchId = o.BranchId,
                BranchName = o.Branch.BranchName,
                DoctorId = o.DoctorId,
                ReferralId = o.ReferralId,
                GrossAmount = o.GrossAmount,
                FinalAmount = o.FinalAmount,
                PaidAmount = o.PaidAmount,
                DueAmount = o.IsComplimentary || o.FinalAmount <= o.PaidAmount ? 0 : o.FinalAmount - o.PaidAmount,
                PaymentStatus = o.PaymentStatus.ToString(),
                PaymentMethod = o.PaymentMethod != null ? o.PaymentMethod.ToString() : null,
                IsComplimentary = o.IsComplimentary,
                IsDeleted = o.IsDeleted,
                TestCount = o.Items.Count,
                CreatedAt = o.CreatedAt,
                CreatedByName = o.CreatedByName,
                UpdatedAt = o.UpdatedAt,
                UpdatedByName = o.UpdatedByName,
                DeletedAt = o.DeletedAt,
                DeletedByName = o.DeletedByName
            })
            .ToListAsync(ct);

        // Doctor / referral live in the platform schema (no navigation): resolve the
        // page's names with ONE query each and a dictionary — O(page size).
        var doctorIds = rows.Where(r => r.DoctorId.HasValue).Select(r => r.DoctorId!.Value).Distinct().ToList();
        if (doctorIds.Count > 0)
        {
            var map = await _db.Doctors.AsNoTracking().Where(d => doctorIds.Contains(d.Id))
                .ToDictionaryAsync(d => d.Id, d => d.FullName, ct);
            foreach (var r in rows) if (r.DoctorId is { } id && map.TryGetValue(id, out var n)) r.DoctorName = n;
        }

        var referralIds = rows.Where(r => r.ReferralId.HasValue).Select(r => r.ReferralId!.Value).Distinct().ToList();
        if (referralIds.Count > 0)
        {
            var map = await _db.Referrals.AsNoTracking().Where(d => referralIds.Contains(d.Id))
                .ToDictionaryAsync(d => d.Id, d => d.FullName, ct);
            foreach (var r in rows) if (r.ReferralId is { } id && map.TryGetValue(id, out var n)) r.ReferralName = n;
        }

        return new PagedResult<OrderDto> { Items = rows, TotalCount = total, PageNumber = page, PageSize = size };
    }
}