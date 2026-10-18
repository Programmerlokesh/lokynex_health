using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.OwnerLedger;

public class GetOwnerLedgerEntriesQuery : IRequest<PagedResult<OwnerLedgerEntryDto>>
{
    /// <summary>Only used by a SuperAdmin; an Owner always gets their own ledger.</summary>
    public Guid? OwnerId { get; set; }
    public Guid? TenantId { get; set; }
    public DateOnly? DateFrom { get; set; }
    public DateOnly? DateTo { get; set; }
    public string? EntryType { get; set; }
    /// <summary>Manual | Subscription (empty = both)</summary>
    public string? Source { get; set; }
    public string? Search { get; set; }
    public bool SortDesc { get; set; } = true;
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 15;
}

public class GetOwnerLedgerEntriesQueryHandler
    : IRequestHandler<GetOwnerLedgerEntriesQuery, PagedResult<OwnerLedgerEntryDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;

    public GetOwnerLedgerEntriesQueryHandler(IApplicationDbContext db, ICurrentUserService user)
    {
        _db = db;
        _user = user;
    }

    public async Task<PagedResult<OwnerLedgerEntryDto>> Handle(GetOwnerLedgerEntriesQuery r, CancellationToken ct)
    {
        var ownerId = await OwnerAccess.ResolveLedgerOwnerIdAsync(_db, _user, r.OwnerId, ct);
        var page = Math.Max(r.PageNumber, 1);
        var size = Math.Clamp(r.PageSize, 1, 5000);
        var term = string.IsNullOrWhiteSpace(r.Search) ? null : r.Search.Trim();
        var like = term is null ? null : $"%{term}%";

        var labs = await _db.Tenants.AsNoTracking()
            .Where(t => t.CreatedByOwnerId == ownerId)
            .Select(t => new { t.Id, t.PrimaryBranchName, t.LabCode })
            .ToListAsync(ct);
        var labById = labs.ToDictionary(l => l.Id);
        // Labs whose NAME matches the search text (searched in memory: tiny list).
        var nameMatches = term is null
            ? new List<Guid>()
            : labs.Where(l => l.PrimaryBranchName.Contains(term, StringComparison.OrdinalIgnoreCase)
                           || l.LabCode.Contains(term, StringComparison.OrdinalIgnoreCase))
                  .Select(l => l.Id).ToList();

        var includeManual = r.Source is null or "" or "Manual";
        var includeSub = (r.Source is null or "" or "Subscription")
                         && (r.EntryType is null or "" or OwnerLedgerTypes.Income);

        // To serve page N of a MERGED list we need the first N*size rows of
        // each source, then merge them with two pointers: O(N*size), not O(all).
        var only = includeManual != includeSub;           // a single source => DB paging
        var take = only ? size : page * size;
        var skip = only ? (page - 1) * size : 0;

        var manual = new List<OwnerLedgerEntryDto>();
        var manualCount = 0;
        if (includeManual)
        {
            var q = _db.OwnerLedgerEntries.AsNoTracking().Where(e => e.OwnerId == ownerId);
            if (r.TenantId.HasValue) q = q.Where(e => e.TenantId == r.TenantId.Value);
            if (r.DateFrom.HasValue) q = q.Where(e => e.EntryDate >= r.DateFrom.Value);
            if (r.DateTo.HasValue) q = q.Where(e => e.EntryDate <= r.DateTo.Value);
            if (!string.IsNullOrEmpty(r.EntryType)) q = q.Where(e => e.EntryType == r.EntryType);
            if (like is not null)
                q = q.Where(e => EF.Functions.ILike(e.Category ?? "", like)
                              || EF.Functions.ILike(e.Description ?? "", like)
                              || EF.Functions.ILike(e.ReferenceNo ?? "", like)
                              || (e.TenantId != null && nameMatches.Contains(e.TenantId.Value)));

            manualCount = await q.CountAsync(ct);
            var ordered = r.SortDesc
                ? q.OrderByDescending(e => e.EntryDate).ThenByDescending(e => e.CreatedAt).ThenBy(e => e.Id)
                : q.OrderBy(e => e.EntryDate).ThenBy(e => e.CreatedAt).ThenBy(e => e.Id);
            var rows = await ordered.Skip(skip).Take(take).ToListAsync(ct);
            manual = rows.Select(e =>
            {
                var lab = e.TenantId.HasValue && labById.TryGetValue(e.TenantId.Value, out var l) ? l : null;
                return new OwnerLedgerEntryDto
                {
                    Id = e.Id,
                    EntryDate = e.EntryDate,
                    EntryType = e.EntryType,
                    Category = e.Category,
                    Amount = e.Amount,
                    TenantId = e.TenantId,
                    LabName = lab?.PrimaryBranchName,
                    LabCode = lab?.LabCode,
                    PaymentMethod = e.PaymentMethod,
                    ReferenceNo = e.ReferenceNo,
                    Description = e.Description,
                    Source = "Manual",
                    CreatedAt = e.CreatedAt
                };
            }).ToList();
        }

        var subs = new List<OwnerLedgerEntryDto>();
        var subCount = 0;
        if (includeSub)
        {
            var q = from s in _db.Subscriptions.AsNoTracking()
                    join t in _db.Tenants.AsNoTracking() on s.TenantId equals t.Id
                    join p in _db.Plans.AsNoTracking() on s.PlanId equals p.Id
                    where t.CreatedByOwnerId == ownerId
                          && s.Status != SubscriptionStatusType.Cancelled
                          && s.AmountPaid > 0
                    select new
                    {
                        s.Id,
                        s.StartDate,
                        s.AmountPaid,
                        s.CreatedAt,
                        s.BranchId,
                        TenantId = t.Id,
                        LabName = t.PrimaryBranchName,
                        t.LabCode,
                        PlanName = p.Name
                    };
            if (r.TenantId.HasValue) q = q.Where(x => x.TenantId == r.TenantId.Value);
            if (r.DateFrom.HasValue) q = q.Where(x => x.StartDate >= r.DateFrom.Value);
            if (r.DateTo.HasValue) q = q.Where(x => x.StartDate <= r.DateTo.Value);
            if (like is not null)
                q = q.Where(x => EF.Functions.ILike(x.LabName, like)
                              || EF.Functions.ILike(x.PlanName, like)
                              || EF.Functions.ILike("Subscription", like));

            subCount = await q.CountAsync(ct);
            var ordered = r.SortDesc
                ? q.OrderByDescending(x => x.StartDate).ThenByDescending(x => x.CreatedAt).ThenBy(x => x.Id)
                : q.OrderBy(x => x.StartDate).ThenBy(x => x.CreatedAt).ThenBy(x => x.Id);
            var rows = await ordered.Skip(skip).Take(take).ToListAsync(ct);
            subs = rows.Select(x => new OwnerLedgerEntryDto
            {
                Id = x.Id,
                EntryDate = x.StartDate,
                EntryType = OwnerLedgerTypes.Income,
                Category = "Subscription",
                Amount = x.AmountPaid,
                TenantId = x.TenantId,
                LabName = x.LabName,
                LabCode = x.LabCode,
                Description = x.BranchId.HasValue ? $"{x.PlanName} plan (branch)" : $"{x.PlanName} plan",
                Source = "Subscription",
                CreatedAt = x.CreatedAt
            }).ToList();
        }

        // ---------- two-pointer merge of two already-sorted lists ----------
        List<OwnerLedgerEntryDto> pageItems;
        if (only)
        {
            pageItems = includeManual ? manual : subs;
        }
        else
        {
            int Cmp(OwnerLedgerEntryDto a, OwnerLedgerEntryDto b)
            {
                var c = a.EntryDate.CompareTo(b.EntryDate);
                if (c == 0) c = a.CreatedAt.CompareTo(b.CreatedAt);
                return r.SortDesc ? -c : c;
            }

            var merged = new List<OwnerLedgerEntryDto>(take);
            int i = 0, j = 0;
            while (merged.Count < take && (i < manual.Count || j < subs.Count))
            {
                if (j >= subs.Count || (i < manual.Count && Cmp(manual[i], subs[j]) <= 0))
                    merged.Add(manual[i++]);
                else
                    merged.Add(subs[j++]);
            }
            pageItems = merged.Skip((page - 1) * size).Take(size).ToList();
        }

        return new PagedResult<OwnerLedgerEntryDto>
        {
            Items = pageItems,
            TotalCount = manualCount + subCount,
            PageNumber = page,
            PageSize = size
        };
    }
}