using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Plans.Queries.GetPlans;

// Raw-SQL projection (billing_cycle cast to text server-side) — same proven
// workaround used in SuperAdminLoginCommandHandler. Column aliases stay plain
// lowercase/snake_case to match the DbContext's global snake_case convention
// (a quoted PascalCase alias breaks EF's SqlQuery<T> column matching).
internal class PlanRow
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public decimal Price { get; set; }
    public string BillingCycle { get; set; } = default!;
    public int MaxUsers { get; set; }
    public int MaxBranches { get; set; }
    public bool IsActive { get; set; }
}

public class GetPlansQueryHandler : IRequestHandler<GetPlansQuery, List<PlanDto>>
{
    private readonly IApplicationDbContext _db;

    public GetPlansQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<PlanDto>> Handle(GetPlansQuery request, CancellationToken cancellationToken)
    {
        var rows = await _db.Database
            .SqlQuery<PlanRow>($@"
                SELECT id, name, price, billing_cycle::text AS billing_cycle,
                       max_users, max_branches, is_active
                FROM platform.plans
                WHERE is_active = true")
            .ToListAsync(cancellationToken);

        return rows.Select(p => new PlanDto
        {
            Id = p.Id,
            Name = p.Name,
            Price = p.Price,
            BillingCycle = p.BillingCycle,
            MaxUsers = p.MaxUsers,
            MaxBranches = p.MaxBranches,
            IsActive = p.IsActive
        }).ToList();
    }
}