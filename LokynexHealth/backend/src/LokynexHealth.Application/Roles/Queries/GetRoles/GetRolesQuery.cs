using MediatR;

namespace LokynexHealth.Application.Roles.Queries.GetRoles;

// Read-only lookup list — powers the Role dropdown on Create/Edit User.
// LabAdmin-only (see RolesController): only the LabAdmin ever assigns roles.
public class GetRolesQuery : IRequest<List<RoleDto>>
{
}

public class RoleDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
}