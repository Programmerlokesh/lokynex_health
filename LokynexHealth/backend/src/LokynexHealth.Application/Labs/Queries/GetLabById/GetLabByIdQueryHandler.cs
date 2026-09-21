using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Labs.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Labs.Queries.GetLabById;

public class GetLabByIdQueryHandler : IRequestHandler<GetLabByIdQuery, LabDetailDto>
{
    private readonly IApplicationDbContext _db;

    public GetLabByIdQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<LabDetailDto> Handle(GetLabByIdQuery request, CancellationToken cancellationToken)
    {
        var tenant = await _db.Tenants
            .Include(t => t.ExtendBranches)
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);

        if (tenant is null)
            throw new NotFoundException("Lab", request.Id);

        // Loaded separately rather than as a navigation property: Subscription has
        // no Tenant nav, and this keeps the query to one extra round trip.
        var subscriptions = await _db.Subscriptions
            .Where(s => s.TenantId == tenant.Id)
            .ToListAsync(cancellationToken);

        var planIds = subscriptions.Select(s => s.PlanId).Distinct().ToList();
        var planNames = await _db.Plans
            .Where(p => planIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p.Name, cancellationToken);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        return new LabDetailDto
        {
            Id = tenant.Id,
            LabCode = tenant.LabCode,
            SchemaName = tenant.SchemaName,
            Subdomain = tenant.Subdomain,
            PrimaryBranchName = tenant.PrimaryBranchName,
            PrimaryBranchAddress = tenant.PrimaryBranchAddress,
            PrimaryBranchPhone = tenant.PrimaryBranchPhone,
            PrimaryBranchEmail = tenant.PrimaryBranchEmail,
            PrimaryBranchPincode = tenant.PrimaryBranchPincode,
            AdminName = tenant.AdminName,
            AdminPhone = tenant.AdminPhone,
            AdminAddress = tenant.AdminAddress,
            AdminEmail = tenant.AdminEmail,
            AdminUsername = tenant.AdminUsername,
            UserLimit = tenant.UserLimit,
            Status = tenant.Status.ToString(),
            CreatedAt = tenant.CreatedAt,
            UpdatedAt = tenant.UpdatedAt,
            Subscription = LabSubscriptionCalculator.Build(subscriptions, planNames, today),
            ExtendBranches = tenant.ExtendBranches.Select(b => new BranchDto
            {
                Id = b.Id,
                BranchName = b.BranchName,
                BranchCode = b.BranchCode,
                BranchAddress = b.BranchAddress,
                BranchPincode = b.BranchPincode,
                BranchPhone = b.BranchPhone
            }).ToList()
        };
    }
}