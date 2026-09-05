using MediatR;

namespace LokynexHealth.Application.Users.Commands.CreateUser;

public class CreateUserCommand : IRequest<Guid>
{
    public string Name { get; set; } = default!;
    public string Username { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public Guid? BranchId { get; set; }
    public Guid? RoleId { get; set; }
    public string Password { get; set; } = default!;
    public List<ModulePermissionInput> Permissions { get; set; } = new();
}

public class ModulePermissionInput
{
    public short ModuleId { get; set; }
    public bool CanView { get; set; }
    public bool CanCreate { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
}