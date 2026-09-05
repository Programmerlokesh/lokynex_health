using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.CommissionPayouts.Commands.GeneratePayouts;

public class GeneratePayoutsCommandHandler : IRequestHandler<GeneratePayoutsCommand, int>
{
    private readonly IApplicationDbContext _db;

    public GeneratePayoutsCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<int> Handle(GeneratePayoutsCommand request, CancellationToken cancellationToken)
    {
        var from = request.DateFrom.ToDateTime(TimeOnly.MinValue);
        var to = request.DateTo.ToDateTime(TimeOnly.MaxValue);

        // ---------- 1. Fetch candidate order items in range — ONE query, with parent Order joined ----------
        // Only items where SOME commission is actually owed (doctor, referral, or technician).
        var candidateItemsQuery = _db.OrderItems
            .Include(i => i.Order)
            .Where(i => i.Order.CreatedAt >= from && i.Order.CreatedAt <= to && !i.Order.IsDeleted)
            .Where(i => (request.BranchId == null || i.Order.BranchId == request.BranchId.Value))
            .Where(i =>
                (i.DoctorCommissionEnabled && i.DoctorCommissionAmount > 0) ||
                (i.ReferralCommissionEnabled && i.ReferralCommissionAmount > 0) ||
                (i.TechnicianId != null && i.TechnicianCommissionAmount > 0));

        var candidateItems = await candidateItemsQuery.ToListAsync(cancellationToken);

        if (candidateItems.Count == 0)
            return 0;

        // ---------- 2. Dedup check — HashSet O(1) lookup (Day 3 core lesson, reused here) ----------
        // Fetch which (OrderItemId, EntityType) combos ALREADY have a payout row,
        // build a HashSet of composite keys, so the generation loop below never
        // creates duplicate payouts for an item that was already processed.
        var candidateItemIds = candidateItems.Select(i => i.Id).ToList();

        var existingPayoutKeys = (await _db.CommissionPayouts
                .Where(p => candidateItemIds.Contains(p.OrderItemId))
                .Select(p => new { p.OrderItemId, p.EntityType })
                .ToListAsync(cancellationToken))
            .Select(p => (p.OrderItemId, p.EntityType))
            .ToHashSet();   // HashSet<(Guid, CommissionEntityType)> — O(1) "already generated?" check

        // ---------- 3. Single O(n) pass building new payout rows ----------
        var newPayouts = new List<CommissionPayout>();
        var now = DateTimeOffset.UtcNow;

        foreach (var item in candidateItems)
        {
            if (item.DoctorCommissionEnabled && item.DoctorCommissionAmount > 0 && item.Order.DoctorId.HasValue
                && !existingPayoutKeys.Contains((item.Id, CommissionEntityType.Doctor)))
            {
                newPayouts.Add(BuildPayout(item, CommissionEntityType.Doctor, item.Order.DoctorId, null, null,
                    item.DoctorCommissionAmount, item.Order.BranchId, request.GeneratedBy, now));
            }

            if (item.ReferralCommissionEnabled && item.ReferralCommissionAmount > 0 && item.Order.ReferralId.HasValue
                && !existingPayoutKeys.Contains((item.Id, CommissionEntityType.Referral)))
            {
                newPayouts.Add(BuildPayout(item, CommissionEntityType.Referral, null, item.Order.ReferralId, null,
                    item.ReferralCommissionAmount, item.Order.BranchId, request.GeneratedBy, now));
            }

            if (item.TechnicianId.HasValue && item.TechnicianCommissionAmount > 0
                && !existingPayoutKeys.Contains((item.Id, CommissionEntityType.Technician)))
            {
                newPayouts.Add(BuildPayout(item, CommissionEntityType.Technician, null, null, item.TechnicianId,
                    item.TechnicianCommissionAmount, item.Order.BranchId, request.GeneratedBy, now));
            }
        }

        if (newPayouts.Count == 0)
            return 0;

        // ---------- 4. Single batch insert, single SaveChanges — one transaction ----------
        foreach (var payout in newPayouts)
            _db.CommissionPayouts.Add(payout);

        await _db.SaveChangesAsync(cancellationToken);

        return newPayouts.Count;
    }

    private static CommissionPayout BuildPayout(
        OrderItem item, CommissionEntityType type, Guid? doctorId, Guid? referralId, Guid? technicianId,
        decimal amount, Guid branchId, Guid? generatedBy, DateTimeOffset now) => new()
        {
            Id = Guid.NewGuid(),
            EntityType = type,
            DoctorId = doctorId,
            ReferralId = referralId,
            TechnicianId = technicianId,
            OrderItemId = item.Id,
            BranchId = branchId,
            CommissionAmount = amount,
            Status = CommissionStatusType.Unpaid,
            GeneratedBy = generatedBy,
            GeneratedAt = now
        };
}