using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Ledger.Queries.GetLedgerAnalytics;

public class GetLedgerAnalyticsQuery : IRequest<LedgerAnalyticsResult>
{
    public Guid? BranchId { get; set; }
    public DateOnly? DateFrom { get; set; }
    public DateOnly? DateTo { get; set; }

    /// <summary>auto (default) | day | week | month</summary>
    public string? Granularity { get; set; }
}

/// <summary>All outflow figures are POSITIVE magnitudes; Net is signed (Income - outflows).</summary>
public class LedgerPeriodTotals
{
    public decimal Income { get; set; }
    public decimal Refund { get; set; }
    public decimal CommissionPayout { get; set; }
    public decimal Expense { get; set; }
    public decimal Net { get; set; }
    public int EntryCount { get; set; }
}

public class LedgerSeriesPoint
{
    public string Bucket { get; set; } = default!;   // yyyy-MM-dd (bucket start)
    public decimal Income { get; set; }
    public decimal Refund { get; set; }
    public decimal CommissionPayout { get; set; }
    public decimal Expense { get; set; }
    public decimal Net { get; set; }
    public decimal CumulativeNet { get; set; }
}

public class LedgerBranchBreakdown
{
    public Guid? BranchId { get; set; }
    public string BranchName { get; set; } = default!;
    public decimal Income { get; set; }
    public decimal Outflow { get; set; }
    public decimal Net { get; set; }
    public int EntryCount { get; set; }
}

public class LedgerAnalyticsResult
{
    public DateOnly DateFrom { get; set; }
    public DateOnly DateTo { get; set; }
    public DateOnly PreviousFrom { get; set; }
    public DateOnly PreviousTo { get; set; }
    public string Granularity { get; set; } = "day";
    public LedgerPeriodTotals Current { get; set; } = new();
    public LedgerPeriodTotals Previous { get; set; } = new();
    public List<LedgerSeriesPoint> Series { get; set; } = new();
    public List<LedgerBranchBreakdown> Branches { get; set; } = new();
}

public class GetLedgerAnalyticsQueryHandler : IRequestHandler<GetLedgerAnalyticsQuery, LedgerAnalyticsResult>
{
    private readonly IApplicationDbContext _db;

    public GetLedgerAnalyticsQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<LedgerAnalyticsResult> Handle(GetLedgerAnalyticsQuery request, CancellationToken ct)
    {
        var baseQuery = _db.LedgerEntries.AsNoTracking().AsQueryable();
        if (request.BranchId.HasValue)
            baseQuery = baseQuery.Where(l => l.BranchId == request.BranchId.Value);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var rangeFrom = request.DateFrom;
        var rangeTo = request.DateTo;

        // "All time": fall back to the first / last entry date.
        if (rangeFrom is null || rangeTo is null)
        {
            var bounds = await baseQuery
                .GroupBy(_ => 1)
                .Select(g => new { Min = g.Min(x => x.EntryDate), Max = g.Max(x => x.EntryDate) })
                .FirstOrDefaultAsync(ct);
            rangeFrom ??= bounds?.Min ?? today.AddDays(-29);
            rangeTo ??= bounds?.Max ?? today;
        }

        var start = rangeFrom.Value;
        var end = rangeTo.Value;
        if (end < start) (start, end) = (end, start);
        if (end.DayNumber - start.DayNumber > 3660) start = end.AddDays(-3660);

        var days = end.DayNumber - start.DayNumber + 1;
        var gran = (request.Granularity ?? "auto").ToLowerInvariant();
        if (gran is not ("day" or "week" or "month"))
            gran = days <= 45 ? "day" : days <= 180 ? "week" : "month";
        if (gran == "day" && days > 400) gran = "week";
        if (gran == "week" && days > 2000) gran = "month";

        // ---------- 1. Current period: ONE grouped query (date x type) ----------
        var rows = await baseQuery
            .Where(l => l.EntryDate >= start && l.EntryDate <= end)
            .GroupBy(l => new { l.EntryDate, l.EntryType })
            .Select(g => new { g.Key.EntryDate, g.Key.EntryType, Total = g.Sum(x => x.Amount), Count = g.Count() })
            .ToListAsync(ct);

        // ---------- 2. Continuous time series (empty buckets are filled with zeros) ----------
        var points = new Dictionary<DateOnly, LedgerSeriesPoint>();
        for (var b = BucketStart(start, gran); b <= end; b = NextBucket(b, gran))
            points[b] = new LedgerSeriesPoint { Bucket = b.ToString("yyyy-MM-dd") };

        foreach (var r in rows)
        {
            var p = points[BucketStart(r.EntryDate, gran)];
            switch (r.EntryType)
            {
                case "Income": p.Income += r.Total; break;
                case "Refund": p.Refund -= r.Total; break;
                case "CommissionPayout": p.CommissionPayout -= r.Total; break;
                case "Expense": p.Expense -= r.Total; break;
            }
        }

        var series = points.OrderBy(kv => kv.Key).Select(kv => kv.Value).ToList();
        decimal cumulative = 0;
        foreach (var p in series)
        {
            p.Net = p.Income - p.Refund - p.CommissionPayout - p.Expense;
            cumulative += p.Net;
            p.CumulativeNet = cumulative;
        }

        var current = BuildTotals(rows.Select(r => (r.EntryType, r.Total, r.Count)));

        // ---------- 3. Previous period of the same length (for % change) ----------
        var prevEnd = start.AddDays(-1);
        var prevStart = prevEnd.AddDays(-(days - 1));
        var prevRows = await baseQuery
            .Where(l => l.EntryDate >= prevStart && l.EntryDate <= prevEnd)
            .GroupBy(l => l.EntryType)
            .Select(g => new { EntryType = g.Key, Total = g.Sum(x => x.Amount), Count = g.Count() })
            .ToListAsync(ct);
        var previous = BuildTotals(prevRows.Select(r => (r.EntryType, r.Total, r.Count)));

        // ---------- 4. Per-branch breakdown ----------
        var branchRows = await baseQuery
            .Where(l => l.EntryDate >= start && l.EntryDate <= end)
            .GroupBy(l => new { l.BranchId, l.EntryType })
            .Select(g => new { g.Key.BranchId, g.Key.EntryType, Total = g.Sum(x => x.Amount), Count = g.Count() })
            .ToListAsync(ct);

        var branchIds = branchRows.Where(r => r.BranchId.HasValue).Select(r => r.BranchId!.Value).Distinct().ToList();
        var names = branchIds.Count == 0
            ? new Dictionary<Guid, string>()
            : await _db.Branches.Where(b => branchIds.Contains(b.Id))
                .ToDictionaryAsync(b => b.Id, b => b.BranchName, ct);

        var branches = branchRows
            .GroupBy(r => r.BranchId)
            .Select(g =>
            {
                var income = g.Where(x => x.EntryType == "Income").Sum(x => x.Total);
                var net = g.Sum(x => x.Total);
                return new LedgerBranchBreakdown
                {
                    BranchId = g.Key,
                    BranchName = g.Key.HasValue && names.TryGetValue(g.Key.Value, out var n) ? n : "Unassigned",
                    Income = income,
                    Outflow = income - net,
                    Net = net,
                    EntryCount = g.Sum(x => x.Count)
                };
            })
            .OrderByDescending(b => b.Net)
            .ToList();

        return new LedgerAnalyticsResult
        {
            DateFrom = start,
            DateTo = end,
            PreviousFrom = prevStart,
            PreviousTo = prevEnd,
            Granularity = gran,
            Current = current,
            Previous = previous,
            Series = series,
            Branches = branches
        };
    }

    private static LedgerPeriodTotals BuildTotals(IEnumerable<(string Type, decimal Total, int Count)> rows)
    {
        var t = new LedgerPeriodTotals();
        foreach (var (type, total, count) in rows)
        {
            switch (type)
            {
                case "Income": t.Income += total; break;
                case "Refund": t.Refund -= total; break;
                case "CommissionPayout": t.CommissionPayout -= total; break;
                case "Expense": t.Expense -= total; break;
            }
            t.EntryCount += count;
        }
        t.Net = t.Income - t.Refund - t.CommissionPayout - t.Expense;
        return t;
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