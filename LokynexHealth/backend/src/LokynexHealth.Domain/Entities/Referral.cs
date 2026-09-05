using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

public class Referral : BaseEntity
{
    public string FullName { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public PlatformRecordStatus Status { get; set; } = PlatformRecordStatus.Active;
}