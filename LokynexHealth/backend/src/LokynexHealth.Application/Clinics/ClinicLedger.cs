using FluentValidation;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Clinics;

// Ledger & P&L of ONE clinic. The analytics response has EXACTLY the same JSON shape as the
// lab ledger (income / refund / commissionPayout / expense / net / series ...), so the
// lab's chart + P&L components are reused on the frontend without any change.

public static class ClinicLedgerTypes
{
    public const string Income = "Income";
    public const string Expense = "Expense";
    public const string Refund = "Refund";
    public static readonly string[] All = { Income, Expense, Refund };
}

public class ClinicLedgerTotals
{
    public decimal Income { get; set; }
    public decimal Refund { get; set; }
    public decimal CommissionPayout { get; set; }   // always 0 for a clinic (kept for the shared UI)
    public decimal Expense { get; set; }
    public decimal Net { get; set; }
    public int EntryCount { get; set; }
}

public class ClinicLedgerSeriesPoint
{
    public string Bucket { get; set; } = default!;
    public decimal Income { get; set; }
    public decimal Refund { get; set; }
    public decimal CommissionPayout { get; set; }
    public decimal Expense { get; set; }
    public decimal Net { get; set; }
    public decimal CumulativeNet { get; set; }
}

public class ClinicLedgerAnalytics
{
    public DateOnly DateFrom { get; set; }
    public DateOnly DateTo { get; set; }
    public DateOnly PreviousFrom { get; set; }
    public DateOnly PreviousTo { get; set; }
    public string Granularity { get; set; } = "day";
    public ClinicLedgerTotals Current { get; set; } = new();
    public ClinicLedgerTotals Previous { get; set; } = new();
    public List<ClinicLedgerSeriesPoint> Series { get; set; } = new();
    public List<object> Branches { get; set; } = new();
}

public class GetClinicLedgerAnalyticsQuery : IRequest<ClinicLedgerAnalytics>
{
    public DateOnly? DateFrom { get; set; }
    public DateOnly? DateTo { get; set; }
    /// <summary>auto (default) | day | week | month</summary>
    public string? Granularity { get; set; }
}

public class GetClinicLedgerAnalyticsQueryHandler : IRequestHandler<GetClinicLedgerAnalyticsQuery, ClinicLedgerAnalytics>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public GetClinicLedgerAnalyticsQueryHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task<ClinicLedgerAnalytics> Handle(GetClinicLedgerAnalyticsQuery r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var baseQ = _db.ClinicLedgerEntries.AsNoTracking().Where(e => e.ClinicId == cid);

        var today = ClinicScope.Today();
        var from = r.DateFrom;
        var to = r.DateTo;
        if (from is null || to is null)
        {
            var min = await baseQ.MinAsync(e => (DateOnly?)e.EntryDate, ct);
            var max = await baseQ.MaxAsync(e => (DateOnly?)e.EntryDate, ct);
            from ??= min ?? today.AddDays(-29);
            to ??= max ?? today;
        }
        var start = from.Value;
        var end = to.Value;
        if (end < start) (start, end) = (end, start);
        if (end.DayNumber - start.DayNumber > 3660) start = end.AddDays(-3660);

        var days = end.DayNumber - start.DayNumber + 1;
        var gran = (r.Granularity ?? "auto").ToLowerInvariant();
        if (gran is not ("day" or "week" or "month")) gran = days <= 45 ? "day" : days <= 180 ? "week" : "month";
        if (gran == "day" && days > 400) gran = "week";
        if (gran == "week" && days > 2000) gran = "month";

        var prevEnd = start.AddDays(-1);
        var prevStart = prevEnd.AddDays(-(days - 1));

        // Grouped IN THE DATABASE for [previous period .. current period]: only a few rows come back.
        var rows = await baseQ.Where(e => e.EntryDate >= prevStart && e.EntryDate <= end)
            .GroupBy(e => new { e.EntryDate, e.EntryType })
            .Select(g => new { g.Key.EntryDate, g.Key.EntryType, Total = g.Sum(x => x.Amount), Count = g.Count() })
            .ToListAsync(ct);

        var points = new Dictionary<DateOnly, ClinicLedgerSeriesPoint>();
        for (var b = BucketStart(start, gran); b <= end; b = NextBucket(b, gran))
            points[b] = new ClinicLedgerSeriesPoint { Bucket = b.ToString("yyyy-MM-dd") };

        var current = new ClinicLedgerTotals();
        var previous = new ClinicLedgerTotals();

        // ONE pass over the grouped rows: O(n)
        foreach (var row in rows)
        {
            var inCurrent = row.EntryDate >= start;
            var t = inCurrent ? current : previous;
            t.EntryCount += row.Count;
            switch (row.EntryType)
            {
                case ClinicLedgerTypes.Income: t.Income += row.Total; break;
                case ClinicLedgerTypes.Refund: t.Refund += row.Total; break;
                case ClinicLedgerTypes.Expense: t.Expense += row.Total; break;
            }
            if (!inCurrent) continue;
            var p = points[BucketStart(row.EntryDate, gran)];
            switch (row.EntryType)
            {
                case ClinicLedgerTypes.Income: p.Income += row.Total; break;
                case ClinicLedgerTypes.Refund: p.Refund += row.Total; break;
                case ClinicLedgerTypes.Expense: p.Expense += row.Total; break;
            }
        }
        current.Net = current.Income - current.Refund - current.Expense;
        previous.Net = previous.Income - previous.Refund - previous.Expense;

        var series = points.OrderBy(kv => kv.Key).Select(kv => kv.Value).ToList();
        decimal cumulative = 0;
        foreach (var p in series)
        {
            p.Net = p.Income - p.Refund - p.Expense;
            cumulative += p.Net;
            p.CumulativeNet = cumulative;
        }

        return new ClinicLedgerAnalytics
        {
            DateFrom = start,
            DateTo = end,
            PreviousFrom = prevStart,
            PreviousTo = prevEnd,
            Granularity = gran,
            Current = current,
            Previous = previous,
            Series = series
        };
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

// ------------------------------ entries ------------------------------
public class ClinicLedgerEntryDto
{
    public Guid Id { get; set; }
    public DateOnly EntryDate { get; set; }
    public string EntryType { get; set; } = default!;
    public string? Category { get; set; }
    public decimal Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? ReferenceNo { get; set; }
    public string? Description { get; set; }
    /// <summary>"Manual" rows can be edited; "Booking" / "BookingRefund" rows are automatic.</summary>
    public string Source { get; set; } = default!;
    public DateTimeOffset CreatedAt { get; set; }
}

public class ClinicLedgerEntriesResult : PagedResult<ClinicLedgerEntryDto>
{
    public decimal FilteredIn { get; set; }
    public decimal FilteredOut { get; set; }
    public decimal FilteredNet { get; set; }
}

public class GetClinicLedgerEntriesQuery : IRequest<ClinicLedgerEntriesResult>
{
    public DateOnly? DateFrom { get; set; }
    public DateOnly? DateTo { get; set; }
    public string? EntryType { get; set; }
    public string? Search { get; set; }
    public bool SortDesc { get; set; } = true;
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class GetClinicLedgerEntriesQueryHandler : IRequestHandler<GetClinicLedgerEntriesQuery, ClinicLedgerEntriesResult>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public GetClinicLedgerEntriesQueryHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task<ClinicLedgerEntriesResult> Handle(GetClinicLedgerEntriesQuery r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var page = Math.Max(r.PageNumber, 1);
        var size = Math.Clamp(r.PageSize, 1, 200);
        var q = _db.ClinicLedgerEntries.AsNoTracking().Where(e => e.ClinicId == cid);
        if (r.DateFrom.HasValue) q = q.Where(e => e.EntryDate >= r.DateFrom.Value);
        if (r.DateTo.HasValue) q = q.Where(e => e.EntryDate <= r.DateTo.Value);
        if (!string.IsNullOrEmpty(r.EntryType)) q = q.Where(e => e.EntryType == r.EntryType);
        if (!string.IsNullOrWhiteSpace(r.Search))
        {
            var like = $"%{ClinicScope.Escape(r.Search)}%";
            q = q.Where(e => EF.Functions.ILike(e.Category ?? "", like) || EF.Functions.ILike(e.Description ?? "", like)
                          || EF.Functions.ILike(e.ReferenceNo ?? "", like));
        }

        var total = await q.CountAsync(ct);
        var sums = await q.GroupBy(e => e.EntryType).Select(g => new { Type = g.Key, Total = g.Sum(x => x.Amount) }).ToListAsync(ct);
        var inSum = sums.Where(s => s.Type == ClinicLedgerTypes.Income).Sum(s => s.Total);
        var outSum = sums.Where(s => s.Type != ClinicLedgerTypes.Income).Sum(s => s.Total);

        var ordered = r.SortDesc
            ? q.OrderByDescending(e => e.EntryDate).ThenByDescending(e => e.CreatedAt).ThenBy(e => e.Id)
            : q.OrderBy(e => e.EntryDate).ThenBy(e => e.CreatedAt).ThenBy(e => e.Id);
        var items = await ordered.Skip((page - 1) * size).Take(size).Select(e => new ClinicLedgerEntryDto
        {
            Id = e.Id,
            EntryDate = e.EntryDate,
            EntryType = e.EntryType,
            Category = e.Category,
            Amount = e.Amount,
            PaymentMethod = e.PaymentMethod,
            ReferenceNo = e.ReferenceNo,
            Description = e.Description,
            Source = e.Source,
            CreatedAt = e.CreatedAt
        }).ToListAsync(ct);

        return new ClinicLedgerEntriesResult
        {
            Items = items,
            TotalCount = total,
            PageNumber = page,
            PageSize = size,
            FilteredIn = inSum,
            FilteredOut = outSum,
            FilteredNet = inSum - outSum
        };
    }
}

// ------------------------------ manual entries ------------------------------
public interface IClinicLedgerFields
{
    DateOnly EntryDate { get; }
    string EntryType { get; }
    string? Category { get; }
    decimal Amount { get; }
    string? PaymentMethod { get; }
    string? ReferenceNo { get; }
    string? Description { get; }
}

public class RecordClinicLedgerEntryCommand : IRequest<Guid>, IClinicLedgerFields
{
    public DateOnly EntryDate { get; set; }
    public string EntryType { get; set; } = default!;
    public string? Category { get; set; }
    public decimal Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? ReferenceNo { get; set; }
    public string? Description { get; set; }
}

public class UpdateClinicLedgerEntryCommand : IRequest, IClinicLedgerFields
{
    public Guid Id { get; set; }
    public DateOnly EntryDate { get; set; }
    public string EntryType { get; set; } = default!;
    public string? Category { get; set; }
    public decimal Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? ReferenceNo { get; set; }
    public string? Description { get; set; }
}

public class DeleteClinicLedgerEntryCommand : IRequest { public Guid Id { get; set; } }

internal static class ClinicLedgerRules
{
    public static void Apply<T>(AbstractValidator<T> v) where T : IClinicLedgerFields
    {
        v.RuleFor(x => x.EntryType).Must(t => ClinicLedgerTypes.All.Contains(t)).WithMessage("Choose Income, Expense or Refund.");
        v.RuleFor(x => x.Amount).GreaterThan(0).LessThan(1_000_000_000m);
        v.RuleFor(x => x.EntryDate).Must(d => d.Year >= 2000 && d <= ClinicScope.Today().AddDays(366)).WithMessage("Entry date is out of range.");
        v.RuleFor(x => x.Category).MaximumLength(60);
        v.RuleFor(x => x.PaymentMethod).MaximumLength(30);
        v.RuleFor(x => x.ReferenceNo).MaximumLength(60);
        v.RuleFor(x => x.Description).MaximumLength(500);
    }
}

public class RecordClinicLedgerEntryCommandValidator : AbstractValidator<RecordClinicLedgerEntryCommand>
{
    public RecordClinicLedgerEntryCommandValidator() => ClinicLedgerRules.Apply(this);
}

public class UpdateClinicLedgerEntryCommandValidator : AbstractValidator<UpdateClinicLedgerEntryCommand>
{
    public UpdateClinicLedgerEntryCommandValidator() => ClinicLedgerRules.Apply(this);
}

public class RecordClinicLedgerEntryCommandHandler : IRequestHandler<RecordClinicLedgerEntryCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public RecordClinicLedgerEntryCommandHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task<Guid> Handle(RecordClinicLedgerEntryCommand r, CancellationToken ct)
    {
        var e = new ClinicLedgerEntry
        {
            Id = Guid.NewGuid(),
            ClinicId = ClinicScope.Id(_user),
            EntryDate = r.EntryDate,
            EntryType = r.EntryType,
            Category = ClinicScope.Clean(r.Category),
            Amount = Math.Round(r.Amount, 2),
            PaymentMethod = ClinicScope.Clean(r.PaymentMethod),
            ReferenceNo = ClinicScope.Clean(r.ReferenceNo),
            Description = ClinicScope.Clean(r.Description),
            Source = "Manual",
            CreatedBy = _user.UserId,
            CreatedAt = DateTimeOffset.UtcNow
        };
        _db.ClinicLedgerEntries.Add(e);
        await _db.SaveChangesAsync(ct);
        return e.Id;
    }
}

public class UpdateClinicLedgerEntryCommandHandler : IRequestHandler<UpdateClinicLedgerEntryCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public UpdateClinicLedgerEntryCommandHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task Handle(UpdateClinicLedgerEntryCommand r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var e = await _db.ClinicLedgerEntries.FirstOrDefaultAsync(x => x.Id == r.Id && x.ClinicId == cid, ct)
                ?? throw new NotFoundException("Ledger entry", r.Id);
        if (e.Source != "Manual") throw new ConflictException("Appointment entries are managed from Appointments.");
        e.EntryDate = r.EntryDate;
        e.EntryType = r.EntryType;
        e.Category = ClinicScope.Clean(r.Category);
        e.Amount = Math.Round(r.Amount, 2);
        e.PaymentMethod = ClinicScope.Clean(r.PaymentMethod);
        e.ReferenceNo = ClinicScope.Clean(r.ReferenceNo);
        e.Description = ClinicScope.Clean(r.Description);
        e.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}

public class DeleteClinicLedgerEntryCommandHandler : IRequestHandler<DeleteClinicLedgerEntryCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public DeleteClinicLedgerEntryCommandHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task Handle(DeleteClinicLedgerEntryCommand r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var e = await _db.ClinicLedgerEntries.FirstOrDefaultAsync(x => x.Id == r.Id && x.ClinicId == cid, ct)
                ?? throw new NotFoundException("Ledger entry", r.Id);
        if (e.Source != "Manual") throw new ConflictException("Appointment entries are managed from Appointments.");
        _db.ClinicLedgerEntries.Remove(e);
        await _db.SaveChangesAsync(ct);
    }
}