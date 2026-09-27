using MediatR;

namespace LokynexHealth.Application.Users.Commands.UpdateUserPermissions;

// LabAdmin-only: changes WHICH ROLE a user has and WHICH MODULES they can
// see/act on. Deliberately separate from UpdateUserCommand (name/email/phone)
// so a routine profile edit can never accidentally touch access control.
public class UpdateUserPermissionsCommand : IRequest
{
    public Guid UserId { get; set; }
    public Guid? RoleId { get; set; }
    public List<ModulePermissionEntry> Permissions { get; set; } = new();

    // Set by the controller from ICurrentUserService — never trusted from body.
    public Guid? UpdatedBy { get; set; }
}

public class ModulePermissionEntry
{
    public short ModuleId { get; set; }
    public bool CanView { get; set; }
    public bool CanCreate { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
}