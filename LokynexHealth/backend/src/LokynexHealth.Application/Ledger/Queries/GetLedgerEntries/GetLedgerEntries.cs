using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Ledger.Queries.GetLedgerEntries;

public class GetLedgerEntriesQuery : IRequest<LedgerEntriesResult>
{
    public Guid? BranchId { get; set; }
    public DateOnly? DateFrom { get; set; }
    public DateOnly? DateTo { get; set; }
    public string? EntryType { get; set; }
    public string? Search { get; set; }

    /// <summary>date_desc (default) | date_asc | amount_desc | amount_asc</summary>
    public string? Sort { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class LedgerEntryDto
{
    public Guid Id { get; set; }
    public Guid? BranchId { get; set; }
    public string? BranchName { get; set; }
    public DateOnly EntryDate { get; set; }
    public string EntryType { get; set; } = default!;
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public string? ReferenceTable { get; set; }
    public Guid? ReferenceId { get; set; }
    public string? ReferenceLabel { get; set; }

    /// <summary>true = recorded by hand (editable). false = auto-synced from an order / payout.</summary>
    public bool IsManual { get; set; }
    public decimal? RunningBalance { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public class LedgerEntriesResult : PagedResult<LedgerEntryDto>
{
    public decimal FilteredIn { get; set; }
    public decimal FilteredOut { get; set; }   // positive magnitude
    public decimal FilteredNet { get; set; }
    public bool HasRunningBalance { get; set; }
}

public class GetLedgerEntriesQueryHandler : IRequestHandler<GetLedgerEntriesQuery, LedgerEntriesResult>
{
    private readonly IApplicationDbContext _db;

    public GetLedgerEntriesQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<LedgerEntriesResult> Handle(GetLedgerEntriesQuery request, CancellationToken ct)
    {
        var pageSize = Math.Clamp(request.PageSize, 1, 100);
        var pageNumber = Math.Max(request.PageNumber, 1);
        var skip = (pageNumber - 1) * pageSize;

        var query = _db.LedgerEntries.AsNoTracking().AsQueryable();

        if (request.BranchId.HasValue)
            query = query.Where(l => l.BranchId == request.BranchId.Value);
        if (request.DateFrom.HasValue)
            query = query.Where(l => l.EntryDate >= request.DateFrom.Value);
        if (request.DateTo.HasValue)
            query = query.Where(l => l.EntryDate <= request.DateTo.Value);
        if (!string.IsNullOrWhiteSpace(request.EntryType))
        {
            var type = request.EntryType.Trim();
            query = query.Where(l => l.EntryType == type);
        }
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim().ToLower();
            query = query.Where(l => l.Description != null && l.Description.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync(ct);
        var filteredIn = await query.Where(l => l.Amount > 0).SumAsync(l => (decimal?)l.Amount, ct) ?? 0m;
        var filteredOut = -(await query.Where(l => l.Amount < 0).SumAsync(l => (decimal?)l.Amount, ct) ?? 0m);
        var total = filteredIn - filteredOut;

        var sort = (request.Sort ?? "date_desc").ToLowerInvariant();
        var hasRunning = sort is "date_desc" or "date_asc";

        IOrderedQueryable<LedgerEntry> ordered = sort switch
        {
            "date_asc" => query.OrderBy(l => l.EntryDate).ThenBy(l => l.CreatedAt).ThenBy(l => l.Id),
            "amount_desc" => query.OrderByDescending(l => l.Amount).ThenByDescending(l => l.Id),
            "amount_asc" => query.OrderBy(l => l.Amount).ThenBy(l => l.Id),
            _ => query.OrderByDescending(l => l.EntryDate).ThenByDescending(l => l.CreatedAt).ThenByDescending(l => l.Id)
        };

        var rows = await ordered.Skip(skip).Take(pageSize).ToListAsync(ct);

        // Running balance: one cheap prefix-sum query instead of a window function over the whole table.
        var balances = new decimal?[rows.Count];
        if (hasRunning && rows.Count > 0)
        {
            var before = skip == 0 ? 0m : await ordered.Select(l => l.Amount).Take(skip).SumAsync(ct);

            if (sort == "date_asc")
            {
                var running = before;
                for (var i = 0; i < rows.Count; i++)
                {
                    running += rows[i].Amount;
                    balances[i] = running;
                }
            }
            else
            {
                var running = total - before;
                for (var i = 0; i < rows.Count; i++)
                {
                    balances[i] = running;
                    running -= rows[i].Amount;
                }
            }
        }

        var branchIds = rows.Where(r => r.BranchId.HasValue).Select(r => r.BranchId!.Value).Distinct().ToList();
        var branchNames = branchIds.Count == 0
            ? new Dictionary<Guid, string>()
            : await _db.Branches.Where(b => branchIds.Contains(b.Id))
                .ToDictionaryAsync(b => b.Id, b => b.BranchName, ct);

        var orderIds = rows.Where(r => r.ReferenceTable == "orders" && r.ReferenceId.HasValue)
            .Select(r => r.ReferenceId!.Value).Distinct().ToList();
        var orderLabels = new Dictionary<Guid, string>();
        if (orderIds.Count > 0)
        {
            var orders = await _db.Orders
                .Where(o => orderIds.Contains(o.Id))
                .Select(o => new { o.Id, o.OrderNumber, Patient = o.Patient.FullName })
                .ToListAsync(ct);
            orderLabels = orders.ToDictionary(o => o.Id, o => $"{o.OrderNumber} · {o.Patient}");
        }

        var items = rows.Select((r, i) => new LedgerEntryDto
        {
            Id = r.Id,
            BranchId = r.BranchId,
            BranchName = r.BranchId.HasValue && branchNames.TryGetValue(r.BranchId.Value, out var bn) ? bn : null,
            EntryDate = r.EntryDate,
            EntryType = r.EntryType,
            Amount = r.Amount,
            Description = r.Description,
            ReferenceTable = r.ReferenceTable,
            ReferenceId = r.ReferenceId,
            ReferenceLabel = r.ReferenceTable switch
            {
                "orders" when r.ReferenceId.HasValue && orderLabels.TryGetValue(r.ReferenceId.Value, out var ol) => ol,
                "commission_payouts" => "Commission payout",
                _ => null
            },
            IsManual = r.ReferenceTable == null,
            RunningBalance = balances[i],
            CreatedAt = r.CreatedAt
        }).ToList();

        return new LedgerEntriesResult
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize,
            FilteredIn = filteredIn,
            FilteredOut = filteredOut,
            FilteredNet = total,
            HasRunningBalance = hasRunning
        };
    }
}