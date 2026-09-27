using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Roles.Queries.GetRoles;

public class GetRolesQueryHandler : IRequestHandler<GetRolesQuery, List<RoleDto>>
{
    private readonly IApplicationDbContext _db;

    public GetRolesQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<RoleDto>> Handle(GetRolesQuery request, CancellationToken cancellationToken)
    {
        return await _db.Roles
            .OrderBy(r => r.Name)
            .Select(r => new RoleDto
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description
            })
            .ToListAsync(cancellationToken);
    }
}