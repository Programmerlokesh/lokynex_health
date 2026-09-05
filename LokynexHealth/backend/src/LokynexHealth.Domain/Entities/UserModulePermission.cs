namespace LokynexHealth.Domain.Entities;

public class UserModulePermission
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public short ModuleId { get; set; }
    public Module Module { get; set; } = default!;

    public bool CanView { get; set; }
    public bool CanCreate { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
}