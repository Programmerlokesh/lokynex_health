using MediatR;

namespace LokynexHealth.Application.Users.Queries.GetUserPermissions;

// Feeds the Edit User dialog's Role + permission-grid so it opens already
// showing what this user currently has, instead of a blank grid.
public class GetUserPermissionsQuery : IRequest<UserPermissionsDto>
{
    public Guid UserId { get; set; }
}

public class UserPermissionsDto
{
    public Guid UserId { get; set; }
    public Guid? RoleId { get; set; }
    public List<ModulePermissionDto> Permissions { get; set; } = new();
}

public class ModulePermissionDto
{
    public short ModuleId { get; set; }
    public string ModuleName { get; set; } = default!;
    public bool CanView { get; set; }
    public bool CanCreate { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
}