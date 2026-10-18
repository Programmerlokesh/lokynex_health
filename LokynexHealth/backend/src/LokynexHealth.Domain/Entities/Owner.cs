using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

/// <summary>A staff member (CEO, manager, marketing...) who sells the software.
/// Lives in platform.owners. Can create labs but never delete them.</summary>
public class Owner : BaseEntity
{
    public string Name { get; set; } = default!;
    public string Role { get; set; } = default!;
    public string Username { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? WhatsappNumber { get; set; }
    public string? Address { get; set; }
    public string? Pincode { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public PlatformRecordStatus Status { get; set; } = PlatformRecordStatus.Active;
    public Guid? CreatedBy { get; set; }
}