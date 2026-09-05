using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Ledger.Commands.SyncLedgerFromOrders;

public class SyncLedgerFromOrdersCommandHandler : IRequestHandler<SyncLedgerFromOrdersCommand, int>
{
    private readonly IApplicationDbContext _db;

    public SyncLedgerFromOrdersCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<int> Handle(SyncLedgerFromOrdersCommand request, CancellationToken cancellationToken)
    {
        var from = request.DateFrom.ToDateTime(TimeOnly.MinValue);
        var to = request.DateTo.ToDateTime(TimeOnly.MaxValue);

        // ---------- 1. Fetch paid/partial orders in range — ONE query ----------
        var orders = await _db.Orders
            .Where(o => o.CreatedAt >= from && o.CreatedAt <= to && !o.IsDeleted)
            .Where(o => o.PaidAmount > 0)
            .Select(o => new { o.Id, o.BranchId, o.PaidAmount, o.CreatedAt })
            .ToListAsync(cancellationToken);

        if (orders.Count == 0)
            return 0;

        // ---------- 2. HashSet dedup — which orders already have an Income ledger entry ----------
        var orderIds = orders.Select(o => o.Id).ToList();
        var alreadySynced = (await _db.LedgerEntries
                .Where(l => l.ReferenceTable == "orders" && l.ReferenceId != null && orderIds.Contains(l.ReferenceId.Value))
                .Select(l => l.ReferenceId!.Value)
                .ToListAsync(cancellationToken))
            .ToHashSet();

        // ---------- 3. Fetch unpaid->paid commission payouts too (Expense side of the ledger) ----------
        var payouts = await _db.CommissionPayouts
            .Where(p => p.Status == CommissionStatusType.Paid && p.PaidAt != null
                     && p.PaidAt >= from && p.PaidAt <= to)
            .Select(p => new { p.Id, p.BranchId, p.CommissionAmount, p.PaidAt })
            .ToListAsync(cancellationToken);

        var payoutIds = payouts.Select(p => p.Id).ToList();
        var payoutAlreadySynced = payoutIds.Count == 0
            ? new HashSet<Guid>()
            : (await _db.LedgerEntries
                .Where(l => l.ReferenceTable == "commission_payouts" && l.ReferenceId != null && payoutIds.Contains(l.ReferenceId.Value))
                .Select(l => l.ReferenceId!.Value)
                .ToListAsync(cancellationToken))
              .ToHashSet();

        // ---------- 4. Single O(n) pass building new ledger rows ----------
        var newEntries = new List<LedgerEntry>();
        var now = DateTimeOffset.UtcNow;

        foreach (var order in orders.Where(o => !alreadySynced.Contains(o.Id)))
        {
            newEntries.Add(new LedgerEntry
            {
                Id = Guid.NewGuid(),
                BranchId = order.BranchId,
                EntryDate = DateOnly.FromDateTime(order.CreatedAt.DateTime),
                EntryType = "Income",
                ReferenceTable = "orders",
                ReferenceId = order.Id,
                Amount = order.PaidAmount,
                Description = "Auto-synced from order payment",
                CreatedAt = now
            });
        }

        foreach (var payout in payouts.Where(p => !payoutAlreadySynced.Contains(p.Id)))
        {
            newEntries.Add(new LedgerEntry
            {
                Id = Guid.NewGuid(),
                BranchId = payout.BranchId,
                EntryDate = DateOnly.FromDateTime(payout.PaidAt!.Value.DateTime),
                EntryType = "CommissionPayout",
                ReferenceTable = "commission_payouts",
                ReferenceId = payout.Id,
                Amount = -payout.CommissionAmount,   // negative — it's an outflow
                Description = "Auto-synced from commission payout",
                CreatedAt = now
            });
        }

        if (newEntries.Count == 0)
            return 0;

        foreach (var entry in newEntries)
            _db.LedgerEntries.Add(entry);

        await _db.SaveChangesAsync(cancellationToken);

        return newEntries.Count;
    }
}