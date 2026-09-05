using System.Globalization;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.CommissionPayouts.Queries.GetPayouts;

public class GetPayoutsQueryHandler : IRequestHandler<GetPayoutsQuery, GetPayoutsResult>
{
    private readonly IApplicationDbContext _db;

    public GetPayoutsQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<GetPayoutsResult> Handle(GetPayoutsQuery request, CancellationToken cancellationToken)
    {
        var query = _db.CommissionPayouts.AsQueryable();

        if (request.DateFrom.HasValue)
        {
            var from = request.DateFrom.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(p => p.GeneratedAt >= from);
        }
        if (request.DateTo.HasValue)
        {
            var to = request.DateTo.Value.ToDateTime(TimeOnly.MaxValue);
            query = query.Where(p => p.GeneratedAt <= to);
        }

        if (!string.IsNullOrWhiteSpace(request.EntityType) &&
            Enum.TryParse<CommissionEntityType>(request.EntityType, out var entityTypeEnum))
        {
            var typeText = entityTypeEnum.ToString();
            query = query.Where(p => p.EntityType.ToString() == typeText);
        }

        if (request.EntityId.HasValue)
        {
            var id = request.EntityId.Value;
            query = query.Where(p => p.DoctorId == id || p.ReferralId == id || p.TechnicianId == id);
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && request.Status != "All")
        {
            if (Enum.TryParse<CommissionStatusType>(request.Status, out var statusEnum))
            {
                var statusText = statusEnum.ToString();
                query = query.Where(p => p.Status.ToString() == statusText);
            }
        }

        // Fetch the filtered set ONCE — everything after this is in-memory (fine at this data volume).
        var payouts = await query
            .Select(p => new
            {
                p.Id,
                p.EntityType,
                p.DoctorId,
                p.ReferralId,
                p.TechnicianId,
                p.OrderItemId,
                p.CommissionAmount,
                p.Status,
                p.GeneratedAt,
                p.PaidAt
            })
            .ToListAsync(cancellationToken);

        var items = payouts.Select(p => new PayoutDto
        {
            Id = p.Id,
            EntityType = p.EntityType.ToString(),
            EntityId = (p.DoctorId ?? p.ReferralId ?? p.TechnicianId)!.Value,
            OrderItemId = p.OrderItemId,
            CommissionAmount = p.CommissionAmount,
            Status = p.Status.ToString(),
            GeneratedAt = p.GeneratedAt,
            PaidAt = p.PaidAt
        }).ToList();

        // ---------- Day/Week/Month bucketing — single grouping pass, O(n) ----------
        string BucketKey(DateTimeOffset date) => request.GroupBy switch
        {
            "Week" => $"{ISOWeek.GetYear(date.DateTime)}-W{ISOWeek.GetWeekOfYear(date.DateTime):D2}",
            "Month" => date.ToString("yyyy-MM"),
            _ => date.ToString("yyyy-MM-dd")   // "Day" default
        };

        var summary = payouts
            .GroupBy(p => BucketKey(p.GeneratedAt))
            .OrderBy(g => g.Key)
            .Select(g => new PayoutSummaryDto
            {
                PeriodLabel = g.Key,
                Count = g.Count(),
                TotalAmount = g.Sum(x => x.CommissionAmount)
            })
            .ToList();

        return new GetPayoutsResult
        {
            Items = items,
            Summary = summary,
            GrandTotal = payouts.Sum(p => p.CommissionAmount)
        };
    }
}