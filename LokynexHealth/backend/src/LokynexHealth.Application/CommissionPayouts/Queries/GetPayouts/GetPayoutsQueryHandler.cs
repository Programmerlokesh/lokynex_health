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

        // Compare enum-to-enum directly — NEVER p.EntityType.ToString() == someString.
        // The .ToString() version gets translated to SQL and breaks native Postgres
        // enums ("operator does not exist" errors — the exact bug already hit and
        // fixed in GetTechniciansQueryHandler and GetCommissionOverridesQueryHandler).
        if (!string.IsNullOrWhiteSpace(request.EntityType) &&
            Enum.TryParse<CommissionEntityType>(request.EntityType, out var entityTypeEnum))
        {
            query = query.Where(p => p.EntityType == entityTypeEnum);
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
                query = query.Where(p => p.Status == statusEnum);
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

        // ---------- Batch-fetch entity names (Doctor/Referral/Technician) ----------
        // Same batch-fetch + Dictionary O(1) lookup pattern used in
        // GetCommissionOverridesQueryHandler — avoids N+1 queries.
        var doctorIds = payouts.Where(p => p.DoctorId.HasValue).Select(p => p.DoctorId!.Value).Distinct().ToList();
        var referralIds = payouts.Where(p => p.ReferralId.HasValue).Select(p => p.ReferralId!.Value).Distinct().ToList();
        var technicianIds = payouts.Where(p => p.TechnicianId.HasValue).Select(p => p.TechnicianId!.Value).Distinct().ToList();

        var doctorNames = doctorIds.Count == 0
            ? new Dictionary<Guid, string>()
            : await _db.Doctors.Where(d => doctorIds.Contains(d.Id))
                .ToDictionaryAsync(d => d.Id, d => d.FullName, cancellationToken);

        var referralNames = referralIds.Count == 0
            ? new Dictionary<Guid, string>()
            : await _db.Referrals.Where(r => referralIds.Contains(r.Id))
                .ToDictionaryAsync(r => r.Id, r => r.FullName, cancellationToken);

        var technicianNames = technicianIds.Count == 0
            ? new Dictionary<Guid, string>()
            : await _db.Technicians.Where(t => technicianIds.Contains(t.Id))
                .ToDictionaryAsync(t => t.Id, t => t.FullName, cancellationToken);

        var items = payouts.Select(p =>
        {
            var entityId = (p.DoctorId ?? p.ReferralId ?? p.TechnicianId)!.Value;
            var entityName = p.EntityType switch
            {
                CommissionEntityType.Doctor => doctorNames.GetValueOrDefault(entityId, "Unknown"),
                CommissionEntityType.Referral => referralNames.GetValueOrDefault(entityId, "Unknown"),
                CommissionEntityType.Technician => technicianNames.GetValueOrDefault(entityId, "Unknown"),
                _ => "Unknown"
            };

            return new PayoutDto
            {
                Id = p.Id,
                EntityType = p.EntityType.ToString(),
                EntityId = entityId,
                EntityName = entityName,
                OrderItemId = p.OrderItemId,
                CommissionAmount = p.CommissionAmount,
                Status = p.Status.ToString(),
                GeneratedAt = p.GeneratedAt,
                PaidAt = p.PaidAt
            };
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