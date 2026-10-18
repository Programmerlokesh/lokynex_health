using LokynexHealth.Application.Common;
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
    private readonly ICurrentUserService _user;

    public CreateSubscriptionCommandHandler(IApplicationDbContext db, ICurrentUserService user)
    {
        _db = db;
        _user = user;
    }

    public async Task<Guid> Handle(CreateSubscriptionCommand request, CancellationToken cancellationToken)
    {
        // Staff may only bill labs they added (a foreign lab looks like "not found").
        var scope = await OwnerAccess.ScopedTenantIdsAsync(_db, _user, cancellationToken);
        if (scope is not null && !scope.Contains(request.TenantId))
            throw new NotFoundException(nameof(Tenant), request.TenantId);

        var tenantExists = await _db.Tenants.AnyAsync(t => t.Id == request.TenantId, cancellationToken);
        if (!tenantExists) throw new NotFoundException(nameof(Tenant), request.TenantId);

        var planExists = await _db.Plans.AnyAsync(p => p.Id == request.PlanId, cancellationToken);
        if (!planExists) throw new NotFoundException(nameof(Plan), request.PlanId);

        if (request.BranchId.HasValue)
        {
            // A branch subscription can only be billed under the branch's own
            // lab — this is the same "route id wins" guard as the branch
            // commands, just enforced at the subscription boundary.
            var branchBelongsToTenant = await _db.TenantBranches.AnyAsync(
                b => b.Id == request.BranchId.Value && b.TenantId == request.TenantId,
                cancellationToken);
            if (!branchBelongsToTenant)
                throw new NotFoundException("Branch", request.BranchId.Value);
        }

        var subscription = new Subscription
        {
            Id = Guid.NewGuid(),
            TenantId = request.TenantId,
            BranchId = request.BranchId,
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