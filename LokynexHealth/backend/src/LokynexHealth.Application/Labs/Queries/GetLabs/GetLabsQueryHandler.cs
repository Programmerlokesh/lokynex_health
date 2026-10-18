using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using LokynexHealth.Application.Labs.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Labs.Queries.GetLabs;

public class GetLabsQueryHandler : IRequestHandler<GetLabsQuery, PagedResult<LabDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetLabsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<PagedResult<LabDto>> Handle(GetLabsQuery request, CancellationToken cancellationToken)
    {
        var query = _db.Tenants.AsQueryable();

        // An Owner only ever sees the labs THEY added.
        if (_currentUser.TokenType == OwnerAccess.OwnerToken)
        {
            var owner = await OwnerAccess.RequireActiveOwnerAsync(_db, _currentUser, cancellationToken);
            query = query.Where(t => t.CreatedByOwnerId == owner.Id);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = $"%{request.Search}%";
            query = query.Where(t => EF.Functions.ILike(t.PrimaryBranchName, term) || EF.Functions.ILike(t.LabCode, term));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        // Materialize FIRST — then map Status.ToString() in memory (LINQ-to-Objects).
        var tenantEntities = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        // One batched query for the whole page instead of N per-lab lookups.
        var tenantIds = tenantEntities.Select(t => t.Id).ToList();

        var subscriptions = await _db.Subscriptions
            .Where(s => tenantIds.Contains(s.TenantId))
            .ToListAsync(cancellationToken);

        var planIds = subscriptions.Select(s => s.PlanId).Distinct().ToList();
        var planNames = await _db.Plans
            .Where(p => planIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p.Name, cancellationToken);

        var subscriptionsByTenant = subscriptions
            .GroupBy(s => s.TenantId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var labs = tenantEntities.Select(t => new LabDto
        {
            Id = t.Id,
            LabCode = t.LabCode,
            PrimaryBranchName = t.PrimaryBranchName,
            Subdomain = t.Subdomain,
            AdminName = t.AdminName,
            UserLimit = t.UserLimit,
            Status = t.Status.ToString(),
            CreatedAt = t.CreatedAt,
            AddedByName = t.CreatedByName ?? "SuperAdmin",
            AddedByRole = t.CreatedByRole ?? "SuperAdmin",
            AddedByType = t.CreatedByOwnerId.HasValue ? "Owner" : "SuperAdmin",
            Subscription = subscriptionsByTenant.TryGetValue(t.Id, out var rows)
                ? LabSubscriptionCalculator.Build(rows, planNames, today)
                : null
        }).ToList();

        return new PagedResult<LabDto>
        {
            Items = labs,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}