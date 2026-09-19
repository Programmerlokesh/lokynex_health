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
        var query = _db.Subscriptions
            .Join(_db.Plans, s => s.PlanId, p => p.Id, (s, p) => new { s, PlanName = p.Name })
            .Join(_db.Tenants, x => x.s.TenantId, t => t.Id, (x, t) => new { x.s, x.PlanName, TenantName = t.PrimaryBranchName })
            .AsQueryable();

        if (request.TenantId.HasValue)
            query = query.Where(x => x.s.TenantId == request.TenantId.Value);

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
            PlanName = x.PlanName,
            StartDate = x.s.StartDate,
            EndDate = x.s.EndDate,
            AmountPaid = x.s.AmountPaid,
            Status = x.s.Status.ToString()
        }).ToList();
    }
}