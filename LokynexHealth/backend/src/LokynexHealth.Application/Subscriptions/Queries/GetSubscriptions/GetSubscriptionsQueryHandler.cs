using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Subscriptions.Queries.GetSubscriptions;

public class GetSubscriptionsQueryHandler : IRequestHandler<GetSubscriptionsQuery, List<SubscriptionDto>>
{
    private readonly IApplicationDbContext _db;

    public GetSubscriptionsQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<SubscriptionDto>> Handle(GetSubscriptionsQuery request, CancellationToken cancellationToken)
    {
        var query =
            from s in _db.Subscriptions
            join p in _db.Plans on s.PlanId equals p.Id
            join t in _db.Tenants on s.TenantId equals t.Id
            join b in _db.TenantBranches on s.BranchId equals (Guid?)b.Id into branchJoin
            from b in branchJoin.DefaultIfEmpty()
            select new { s, PlanName = p.Name, TenantName = t.PrimaryBranchName, BranchName = (string?)b.BranchName };

        if (request.TenantId.HasValue)
            query = query.Where(x => x.s.TenantId == request.TenantId.Value);

        if (request.BranchId.HasValue)
            query = query.Where(x => x.s.BranchId == request.BranchId.Value);

        // Materialize FIRST — then map Status.ToString() in memory. The .ToString()
        // inside a .Select() that runs before .ToListAsync() gets translated to SQL
        // and breaks native Postgres enums (recurring bug, fixed the same way here).
        var subscriptionRows = await query
            .OrderByDescending(x => x.s.CreatedAt)
            .ToListAsync(cancellationToken);

        return subscriptionRows.Select(x => new SubscriptionDto
        {
            Id = x.s.Id,
            TenantId = x.s.TenantId,
            TenantName = x.TenantName,
            BranchId = x.s.BranchId,
            BranchName = x.BranchName,
            PlanId = x.s.PlanId,
            PlanName = x.PlanName,
            StartDate = x.s.StartDate,
            EndDate = x.s.EndDate,
            AmountPaid = x.s.AmountPaid,
            AutoRenew = x.s.AutoRenew,
            Status = x.s.Status.ToString()
        }).ToList();
    }
}