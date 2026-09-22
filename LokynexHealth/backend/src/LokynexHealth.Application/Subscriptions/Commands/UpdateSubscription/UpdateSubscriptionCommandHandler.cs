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

    public UpdateSubscriptionCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(UpdateSubscriptionCommand request, CancellationToken cancellationToken)
    {
        var subscription = await _db.Subscriptions
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);
        if (subscription is null)
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