using LokynexHealth.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Orders.Common;

/// <summary>
/// Keeps ledger "Income" rows (auto-synced from an order's payments) honest when an
/// order is edited or deleted. If the order was never synced there is nothing to do.
/// </summary>
public static class OrderLedger
{
    private static IQueryable<Domain.Entities.LedgerEntry> ForOrder(IApplicationDbContext db, Guid orderId) =>
        db.LedgerEntries.Where(l => l.ReferenceTable == "orders" && l.ReferenceId == orderId);

    /// <summary>Edit: first entry follows the new paid amount; removed entirely if nothing is paid.</summary>
    public static async Task ReconcileAsync(
        IApplicationDbContext db, Guid orderId, Guid branchId, decimal paid, CancellationToken ct)
    {
        var entries = await ForOrder(db, orderId).ToListAsync(ct);
        for (var i = 0; i < entries.Count; i++)
        {
            if (paid <= 0 || i > 0) { db.LedgerEntries.Remove(entries[i]); continue; }
            entries[i].Amount = paid;
            entries[i].BranchId = branchId;
        }
    }

    /// <summary>Delete: the income disappears; "Sync from orders" re-creates it if the order is restored.</summary>
    public static async Task RemoveAsync(IApplicationDbContext db, Guid orderId, CancellationToken ct) =>
        db.LedgerEntries.RemoveRange(await ForOrder(db, orderId).ToListAsync(ct));
}