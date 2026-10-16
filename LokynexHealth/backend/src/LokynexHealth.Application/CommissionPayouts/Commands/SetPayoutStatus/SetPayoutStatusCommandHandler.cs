using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.CommissionPayouts.Commands.SetPayoutStatus;

public class SetPayoutStatusCommandHandler : IRequestHandler<SetPayoutStatusCommand, int>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;

    public SetPayoutStatusCommandHandler(IApplicationDbContext db, ICurrentUserService user)
    {
        _db = db;
        _user = user;
    }

    public async Task<int> Handle(SetPayoutStatusCommand request, CancellationToken ct)
    {
        var target = Enum.Parse<CommissionStatusType>(request.Status, ignoreCase: true);
        var ids = request.PayoutIds.Distinct().ToList();

        // Only rows that actually change are loaded, so re-clicking is harmless (idempotent).
        var payouts = await _db.CommissionPayouts
            .Where(p => ids.Contains(p.Id) && p.Status != target)
            .ToListAsync(ct);

        var now = DateTimeOffset.UtcNow;
        foreach (var p in payouts)
        {
            p.Status = target;
            p.PaidAt = target == CommissionStatusType.Paid ? now : null;
            p.PaidBy = target == CommissionStatusType.Paid ? _user.UserId : null;
        }

        await _db.SaveChangesAsync(ct);
        return payouts.Count;
    }
}