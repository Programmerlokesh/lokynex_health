using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Plans.Queries.GetPlans;

public class GetPlansQueryHandler : IRequestHandler<GetPlansQuery, List<PlanDto>>
{
    private readonly IApplicationDbContext _db;

    public GetPlansQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<PlanDto>> Handle(GetPlansQuery request, CancellationToken cancellationToken)
    {
        return await _db.Plans
            .Where(p => p.IsActive)
            .Select(p => new PlanDto
            {
                Id = p.Id,
                Name = p.Name,
                Price = p.Price,
                BillingCycle = p.BillingCycle.ToString(),
                MaxUsers = p.MaxUsers,
                MaxBranches = p.MaxBranches,
                IsActive = p.IsActive
            })
            .ToListAsync(cancellationToken);
    }
}