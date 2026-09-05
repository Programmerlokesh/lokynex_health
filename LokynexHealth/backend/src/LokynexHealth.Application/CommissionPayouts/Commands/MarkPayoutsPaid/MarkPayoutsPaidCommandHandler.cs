using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.CommissionPayouts.Commands.MarkPayoutsPaid;

public class MarkPayoutsPaidCommandHandler : IRequestHandler<MarkPayoutsPaidCommand, int>
{
    private readonly IApplicationDbContext _db;

    public MarkPayoutsPaidCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<int> Handle(MarkPayoutsPaidCommand request, CancellationToken cancellationToken)
    {
        var payouts = await _db.CommissionPayouts
            .Where(p => request.PayoutIds.Contains(p.Id) && p.Status == CommissionStatusType.Unpaid)
            .ToListAsync(cancellationToken);

        var now = DateTimeOffset.UtcNow;
        foreach (var payout in payouts)
        {
            payout.Status = CommissionStatusType.Paid;
            payout.PaidAt = now;
            payout.PaidBy = request.PaidBy;
        }

        await _db.SaveChangesAsync(cancellationToken);

        return payouts.Count;
    }
}