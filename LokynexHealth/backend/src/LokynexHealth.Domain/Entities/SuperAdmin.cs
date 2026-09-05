using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

public class SuperAdmin : BaseEntity
{
    public string Name { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string Username { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public PlatformRecordStatus Status { get; set; } = PlatformRecordStatus.Active;
}