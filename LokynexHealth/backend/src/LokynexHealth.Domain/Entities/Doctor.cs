using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

public class Doctor : BaseEntity
{
    public string FullName { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? Specialization { get; set; }
    public PlatformRecordStatus Status { get; set; } = PlatformRecordStatus.Active; // <-- confirm eta
}