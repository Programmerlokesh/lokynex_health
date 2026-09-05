using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Subscriptions.Commands.CreateSubscription;

public class CreateSubscriptionCommandHandler : IRequestHandler<CreateSubscriptionCommand, Guid>
{
    private readonly IApplicationDbContext _db;

    public CreateSubscriptionCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Guid> Handle(CreateSubscriptionCommand request, CancellationToken cancellationToken)
    {
        var tenantExists = await _db.Tenants.AnyAsync(t => t.Id == request.TenantId, cancellationToken);
        if (!tenantExists) throw new NotFoundException(nameof(Tenant), request.TenantId);

        var planExists = await _db.Plans.AnyAsync(p => p.Id == request.PlanId, cancellationToken);
        if (!planExists) throw new NotFoundException(nameof(Plan), request.PlanId);

        var subscription = new Subscription
        {
            Id = Guid.NewGuid(),
            TenantId = request.TenantId,
            PlanId = request.PlanId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            AmountPaid = request.AmountPaid,
            Status = SubscriptionStatusType.Active,
            AutoRenew = true,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.Subscriptions.Add(subscription);
        await _db.SaveChangesAsync(cancellationToken);
        return subscription.Id;
    }
}