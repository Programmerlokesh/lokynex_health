using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Ledger.Queries.GetLedgerSummary;

public class GetLedgerSummaryQueryHandler : IRequestHandler<GetLedgerSummaryQuery, LedgerSummaryResult>
{
    private readonly IApplicationDbContext _db;

    public GetLedgerSummaryQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<LedgerSummaryResult> Handle(GetLedgerSummaryQuery request, CancellationToken cancellationToken)
    {
        var query = _db.LedgerEntries.AsQueryable();

        if (request.BranchId.HasValue)
            query = query.Where(l => l.BranchId == request.BranchId.Value);

        if (request.DateFrom.HasValue)
            query = query.Where(l => l.EntryDate >= request.DateFrom.Value);

        if (request.DateTo.HasValue)
            query = query.Where(l => l.EntryDate <= request.DateTo.Value);

        // Database-level GROUP BY — SQL does the summing, we only get back one row per EntryType.
        var byType = await query
            .GroupBy(l => l.EntryType)
            .Select(g => new LedgerSummaryDto
            {
                EntryType = g.Key,
                TotalAmount = g.Sum(x => x.Amount),
                EntryCount = g.Count()
            })
            .OrderBy(d => d.EntryType)
            .ToListAsync(cancellationToken);

        // Net P&L = sum across all types (income positive, expenses/payouts already negative — see Section 4).
        var netProfitLoss = byType.Sum(d => d.TotalAmount);

        return new LedgerSummaryResult
        {
            ByType = byType,
            NetProfitLoss = netProfitLoss
        };
    }
}