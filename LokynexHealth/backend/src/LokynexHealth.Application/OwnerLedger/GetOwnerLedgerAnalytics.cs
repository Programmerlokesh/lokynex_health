using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.OwnerLedger;

public class GetOwnerLedgerAnalyticsQuery : IRequest<OwnerLedgerAnalyticsResult>
{
    /// <summary>Only used by a SuperAdmin; an Owner always gets their own ledger.</summary>
    public Guid? OwnerId { get; set; }
    public Guid? TenantId { get; set; }
    public DateOnly? DateFrom { get; set; }
    public DateOnly? DateTo { get; set; }
    /// <summary>auto (default) | day | week | month</summary>
    public string? Granularity { get; set; }
}

public class GetOwnerLedgerAnalyticsQueryHandler
    : IRequestHandler<GetOwnerLedgerAnalyticsQuery, OwnerLedgerAnalyticsResult>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;

    public GetOwnerLedgerAnalyticsQueryHandler(IApplicationDbContext db, ICurrentUserService user)
    {
        _db = db;
        _user = user;
    }

    /// <summary>One normalised money row. Manual entries and subscription sales
    /// are both turned into facts, so every report below is ONE loop over them.</summary>
    private sealed class Fact
    {
        public DateOnly Date { get; init; }
        public string Type { get; init; } = default!;
        public string Category { get; init; } = default!;
        public Guid? TenantId { get; init; }
        public decimal Amount { get; init; }
        public int Count { get; init; }
        public bool IsSubscription { get; init; }
    }

    public async Task<OwnerLedgerAnalyticsResult> Handle(GetOwnerLedgerAnalyticsQuery r, CancellationToken ct)
    {
        var ownerId = await OwnerAccess.ResolveLedgerOwnerIdAsync(_db, _user, r.OwnerId, ct);

        // ---------- labs this owner added (dictionary => O(1) name lookups) ----------
        var labs = await _db.Tenants.AsNoTracking()
            .Where(t => t.CreatedByOwnerId == ownerId)
            .Select(t => new { t.Id, t.PrimaryBranchName, t.LabCode, t.CreatedAt })
            .ToListAsync(ct);
        var labById = labs.ToDictionary(l => l.Id);

        // A lab filter that is not one of THIS owner's labs matches nothing.
        var tenantFilter = r.TenantId;
        var subTenantIds = tenantFilter.HasValue
            ? (labById.ContainsKey(tenantFilter.Value) ? new List<Guid> { tenantFilter.Value } : new List<Guid>())
            : labs.Select(l => l.Id).ToList();

        var manualBase = _db.OwnerLedgerEntries.AsNoTracking().Where(e => e.OwnerId == ownerId);
        if (tenantFilter.HasValue) manualBase = manualBase.Where(e => e.TenantId == tenantFilter.Value);

        var subBase = _db.Subscriptions.AsNoTracking().Where(s =>
            subTenantIds.Contains(s.TenantId)
            && s.Status != SubscriptionStatusType.Cancelled
            && s.AmountPaid > 0);

        // ---------- date range ("all time" = first..last activity) ----------
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var rangeFrom = r.DateFrom;
        var rangeTo = r.DateTo;
        if (rangeFrom is null || rangeTo is null)
        {
            var mMin = await manualBase.MinAsync(e => (DateOnly?)e.EntryDate, ct);
            var mMax = await manualBase.MaxAsync(e => (DateOnly?)e.EntryDate, ct);
            var sMin = await subBase.MinAsync(s => (DateOnly?)s.StartDate, ct);
            var sMax = await subBase.MaxAsync(s => (DateOnly?)s.StartDate, ct);
            var mins = new[] { mMin, sMin }.Where(x => x.HasValue).Select(x => x!.Value).ToList();
            var maxs = new[] { mMax, sMax }.Where(x => x.HasValue).Select(x => x!.Value).ToList();
            rangeFrom ??= mins.Count > 0 ? mins.Min() : today.AddDays(-29);
            rangeTo ??= maxs.Count > 0 ? maxs.Max() : today;
        }

        var start = rangeFrom.Value;
        var end = rangeTo.Value;
        if (end < start) (start, end) = (end, start);
        if (end.DayNumber - start.DayNumber > 3660) start = end.AddDays(-3660);

        var days = end.DayNumber - start.DayNumber + 1;
        var gran = (r.Granularity ?? "auto").ToLowerInvariant();
        if (gran is not ("day" or "week" or "month"))
            gran = days <= 45 ? "day" : days <= 180 ? "week" : "month";
        if (gran == "day" && days > 400) gran = "week";
        if (gran == "week" && days > 2000) gran = "month";

        var prevEnd = start.AddDays(-1);
        var prevStart = prevEnd.AddDays(-(days - 1));

        // ---------- load facts for [previous period .. current period] ----------
        // Grouped IN THE DATABASE, so only a few aggregated rows come back.
        var manualRows = await manualBase
            .Where(e => e.EntryDate >= prevStart && e.EntryDate <= end)
            .GroupBy(e => new { e.EntryDate, e.EntryType, e.Category, e.TenantId })
            .Select(g => new
            {
                g.Key.EntryDate,
                g.Key.EntryType,
                g.Key.Category,
                g.Key.TenantId,
                Total = g.Sum(x => x.Amount),
                Count = g.Count()
            })
            .ToListAsync(ct);

        var subRows = await subBase
            .Where(s => s.StartDate >= prevStart && s.StartDate <= end)
            .GroupBy(s => new { s.StartDate, s.TenantId })
            .Select(g => new { g.Key.StartDate, g.Key.TenantId, Total = g.Sum(x => x.AmountPaid), Count = g.Count() })
            .ToListAsync(ct);

        var facts = new List<Fact>(manualRows.Count + subRows.Count);
        foreach (var m in manualRows)
            facts.Add(new Fact
            {
                Date = m.EntryDate,
                Type = m.EntryType,
                Category = string.IsNullOrWhiteSpace(m.Category) ? "Uncategorized" : m.Category!,
                TenantId = m.TenantId,
                Amount = m.Total,
                Count = m.Count
            });
        foreach (var s in subRows)
            facts.Add(new Fact
            {
                Date = s.StartDate,
                Type = OwnerLedgerTypes.Income,
                Category = "Subscription",
                TenantId = s.TenantId,
                Amount = s.Total,
                Count = s.Count,
                IsSubscription = true
            });

        // ---------- continuous series (empty buckets filled with zeros) ----------
        var points = new Dictionary<DateOnly, OwnerLedgerSeriesPoint>();
        for (var b = BucketStart(start, gran); b <= end; b = NextBucket(b, gran))
            points[b] = new OwnerLedgerSeriesPoint { Bucket = b.ToString("yyyy-MM-dd") };

        var current = new OwnerLedgerTotals();
        var previous = new OwnerLedgerTotals();
        var labAgg = new Dictionary<Guid?, OwnerLedgerLabRow>();
        var catAgg = new Dictionary<(string Type, string Category), OwnerLedgerCategoryRow>();
        decimal subRevenue = 0;
        var subCount = 0;

        // ---------- ONE pass over every fact: O(n) ----------
        foreach (var f in facts)
        {
            var inCurrent = f.Date >= start;
            AddTo(inCurrent ? current : previous, f.Type, f.Amount, f.Count);

            var ck = (f.Type, f.Category);
            if (!catAgg.TryGetValue(ck, out var cat))
                catAgg[ck] = cat = new OwnerLedgerCategoryRow { EntryType = f.Type, Category = f.Category };
            if (inCurrent) { cat.Total += f.Amount; cat.EntryCount += f.Count; }
            else cat.PreviousTotal += f.Amount;

            if (!inCurrent) continue;

            AddTo(points[BucketStart(f.Date, gran)], f.Type, f.Amount);

            if (!labAgg.TryGetValue(f.TenantId, out var lab))
            {
                var known = f.TenantId.HasValue && labById.TryGetValue(f.TenantId.Value, out var l) ? l : null;
                labAgg[f.TenantId] = lab = new OwnerLedgerLabRow
                {
                    TenantId = f.TenantId,
                    LabName = known?.PrimaryBranchName ?? "General (not lab specific)",
                    LabCode = known?.LabCode
                };
            }
            if (f.Type == OwnerLedgerTypes.Income) lab.Income += f.Amount; else lab.Outflow += f.Amount;
            lab.EntryCount += f.Count;
            if (f.IsSubscription) { lab.SubscriptionCount += f.Count; subRevenue += f.Amount; subCount += f.Count; }
        }

        current.Net = current.Income - current.Refund - current.CommissionPayout - current.Expense;
        previous.Net = previous.Income - previous.Refund - previous.CommissionPayout - previous.Expense;

        var series = points.OrderBy(kv => kv.Key).Select(kv => kv.Value).ToList();
        decimal cumulative = 0;
        foreach (var p in series)
        {
            p.Net = p.Income - p.Refund - p.CommissionPayout - p.Expense;
            cumulative += p.Net;
            p.CumulativeNet = cumulative;
        }

        foreach (var l in labAgg.Values) l.Net = l.Income - l.Outflow;

        return new OwnerLedgerAnalyticsResult
        {
            DateFrom = start,
            DateTo = end,
            PreviousFrom = prevStart,
            PreviousTo = prevEnd,
            Granularity = gran,
            Current = current,
            Previous = previous,
            Series = series,
            Labs = labAgg.Values.OrderByDescending(l => l.Income).ThenByDescending(l => l.Net).ToList(),
            Categories = catAgg.Values
                .Where(c => c.Total != 0 || c.PreviousTotal != 0)
                .OrderBy(c => Array.IndexOf(OwnerLedgerTypes.All, c.EntryType))
                .ThenByDescending(c => c.Total).ToList(),
            LabOptions = labs.OrderBy(l => l.PrimaryBranchName)
                .Select(l => new OwnerLedgerLabOption { Id = l.Id, Name = l.PrimaryBranchName, Code = l.LabCode }).ToList(),
            SubscriptionRevenue = subRevenue,
            SubscriptionCount = subCount,
            LabsAddedInPeriod = labs.Count(l =>
            {
                var d = DateOnly.FromDateTime(l.CreatedAt.UtcDateTime);
                return d >= start && d <= end;
            }),
            TotalLabs = labs.Count
        };
    }

    private static void AddTo(OwnerLedgerTotals t, string type, decimal amount, int count)
    {
        AddAmount(type, amount, v => t.Income += v, v => t.Refund += v, v => t.CommissionPayout += v, v => t.Expense += v);
        t.EntryCount += count;
    }

    private static void AddTo(OwnerLedgerSeriesPoint p, string type, decimal amount) =>
        AddAmount(type, amount, v => p.Income += v, v => p.Refund += v, v => p.CommissionPayout += v, v => p.Expense += v);

    private static void AddAmount(string type, decimal amount,
        Action<decimal> income, Action<decimal> refund, Action<decimal> commission, Action<decimal> expense)
    {
        switch (type)
        {
            case OwnerLedgerTypes.Income: income(amount); break;
            case OwnerLedgerTypes.Refund: refund(amount); break;
            case OwnerLedgerTypes.CommissionPayout: commission(amount); break;
            case OwnerLedgerTypes.Expense: expense(amount); break;
        }
    }

    private static DateOnly BucketStart(DateOnly d, string g) => g switch
    {
        "week" => d.AddDays(-(((int)d.DayOfWeek + 6) % 7)),   // Monday
        "month" => new DateOnly(d.Year, d.Month, 1),
        _ => d
    };

    private static DateOnly NextBucket(DateOnly d, string g) => g switch
    {
        "week" => d.AddDays(7),
        "month" => d.AddMonths(1),
        _ => d.AddDays(1)
    };
}