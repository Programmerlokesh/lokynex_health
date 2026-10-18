using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Subscriptions.Commands.UpdateSubscription;

public class UpdateSubscriptionCommandHandler : IRequestHandler<UpdateSubscriptionCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;

    public UpdateSubscriptionCommandHandler(IApplicationDbContext db, ICurrentUserService user)
    {
        _db = db;
        _user = user;
    }

    public async Task Handle(UpdateSubscriptionCommand request, CancellationToken cancellationToken)
    {
        var subscription = await _db.Subscriptions
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);
        if (subscription is null)
            throw new NotFoundException(nameof(Subscription), request.Id);

        // Staff may only edit subscriptions of labs they added.
        var scope = await OwnerAccess.ScopedTenantIdsAsync(_db, _user, cancellationToken);
        if (scope is not null && !scope.Contains(subscription.TenantId))
            throw new NotFoundException(nameof(Subscription), request.Id);

        var planExists = await _db.Plans.AnyAsync(p => p.Id == request.PlanId, cancellationToken);
        if (!planExists)
            throw new NotFoundException(nameof(Plan), request.PlanId);

        subscription.PlanId = request.PlanId;
        subscription.StartDate = request.StartDate;
        subscription.EndDate = request.EndDate;
        subscription.AmountPaid = request.AmountPaid;
        subscription.Status = Enum.Parse<SubscriptionStatusType>(request.Status);
        subscription.AutoRenew = request.AutoRenew;

        await _db.SaveChangesAsync(cancellationToken);
    }
}