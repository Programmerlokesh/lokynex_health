using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Orders.Common;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Orders.Commands.UpdateOrder;

public class UpdateOrderCommandHandler : IRequestHandler<UpdateOrderCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public UpdateOrderCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(UpdateOrderCommand request, CancellationToken ct)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(Order), request.Id);

        if (order.IsDeleted)
            throw new ConflictException("A deleted order cannot be edited. Restore it first.");

        var now = DateTimeOffset.UtcNow;
        var actor = await OrderActorResolver.ResolveAsync(_db, _currentUser, ct);
        var before = OrderAudit.Snapshot(order);

        var composed = await OrderComposer.ApplyAsync(_db, request, order, now, ct);

        // ---------- Merge lines by TestId (hash lookups). Kept lines keep their id,
        // report status and commission payouts; only changed fields are rewritten. ----------
        var existingByTest = order.Items.ToDictionary(i => i.TestId);
        var newByTest = composed.Items.ToDictionary(i => i.TestId);

        var itemIds = order.Items.Select(i => i.Id).ToList();
        var payoutsByItem = (await _db.CommissionPayouts.Where(p => itemIds.Contains(p.OrderItemId)).ToListAsync(ct))
            .ToLookup(p => p.OrderItemId);
        var reportItemIds = (await _db.ReportDocuments
                .Where(r => itemIds.Contains(r.OrderItemId) && !r.IsDeleted)
                .Select(r => r.OrderItemId).Distinct().ToListAsync(ct))
            .ToHashSet();

        // removed tests
        foreach (var old in existingByTest.Values.Where(i => !newByTest.ContainsKey(i.TestId)).ToList())
        {
            if (payoutsByItem[old.Id].Any())
                throw new ConflictException("A test with a generated commission payout cannot be removed from the order.");
            if (reportItemIds.Contains(old.Id))
                throw new ConflictException("A test that already has a report cannot be removed from the order.");
            order.Items.Remove(old);
            _db.OrderItems.Remove(old);
        }

        // kept + added tests
        foreach (var fresh in composed.Items)
        {
            if (!existingByTest.TryGetValue(fresh.TestId, out var cur))
            {
                _db.OrderItems.Add(fresh);
                continue;
            }

            cur.Price = fresh.Price;
            cur.TechnicianId = fresh.TechnicianId;
            cur.DoctorCommissionEnabled = fresh.DoctorCommissionEnabled;
            cur.DoctorCommissionAmount = fresh.DoctorCommissionAmount;
            cur.ReferralCommissionEnabled = fresh.ReferralCommissionEnabled;
            cur.ReferralCommissionAmount = fresh.ReferralCommissionAmount;
            cur.TechnicianCommissionAmount = fresh.TechnicianCommissionAmount;

            foreach (var payout in payoutsByItem[cur.Id])
                SyncPayout(payout, cur, order);
        }

        // ---------- Payments: the form always sends the full set, so replace ----------
        _db.OrderPayments.RemoveRange(order.Payments.ToList());
        _db.OrderPayments.AddRange(composed.Payments);

        var after = new OrderSnapshot(
            order.PatientId, order.RelativeId, order.BranchId, order.DoctorId, order.ReferralId,
            order.DiscountType.ToString(), order.DiscountValue, order.IsComplimentary,
            order.GrossAmount, order.FinalAmount, order.PaidAmount,
            composed.Items.OrderBy(i => i.TestId).Select(i => new SnapLine(i.TestId, i.Price, i.TechnicianId)).ToList(),
            composed.Payments.GroupBy(p => p.PaymentMethod).OrderBy(g => g.Key.ToString())
                .Select(g => new SnapPayment(g.Key.ToString(), g.Sum(p => p.Amount))).ToList());

        var ids = before.Items.Select(i => i.TestId).Concat(after.Items.Select(i => i.TestId)).Distinct().ToList();
        var names = await _db.Tests.AsNoTracking().Where(t => ids.Contains(t.Id))
            .ToDictionaryAsync(t => t.Id, t => t.Name, ct);

        var summary = OrderAudit.Diff(before, after, names);
        if (summary.Length == 0) return; // nothing changed: no audit row, no "updated by" noise

        order.UpdatedAt = now;
        order.UpdatedBy = actor.UserId;
        order.UpdatedByName = actor.Name;

        _db.OrderAuditLogs.Add(OrderAudit.Entry(order.Id, "Edit", actor, now, summary, before, after));
        await OrderLedger.ReconcileAsync(_db, order.Id, order.BranchId, order.PaidAmount, ct);

        await _db.SaveChangesAsync(ct);
    }

    /// <summary>Unpaid payouts follow the edit; a PAID payout must not silently change.</summary>
    private void SyncPayout(CommissionPayout payout, OrderItem item, Order order)
    {
        var (amount, doctorId, referralId, technicianId) = payout.EntityType switch
        {
            CommissionEntityType.Doctor => (item.DoctorCommissionEnabled ? item.DoctorCommissionAmount : 0m, order.DoctorId, (Guid?)null, (Guid?)null),
            CommissionEntityType.Referral => (item.ReferralCommissionEnabled ? item.ReferralCommissionAmount : 0m, (Guid?)null, order.ReferralId, (Guid?)null),
            _ => (item.TechnicianId != null ? item.TechnicianCommissionAmount : 0m, (Guid?)null, (Guid?)null, item.TechnicianId)
        };

        var changed = payout.CommissionAmount != amount
                      || payout.DoctorId != doctorId || payout.ReferralId != referralId || payout.TechnicianId != technicianId;
        if (!changed) return;

        if (payout.Status == CommissionStatusType.Paid)
            throw new ConflictException("This order has an already PAID commission. Commission-affecting changes are not allowed.");

        if (amount <= 0) { _db.CommissionPayouts.Remove(payout); return; }
        payout.CommissionAmount = amount;
        payout.DoctorId = doctorId;
        payout.ReferralId = referralId;
        payout.TechnicianId = technicianId;
        payout.BranchId = order.BranchId;
    }
}