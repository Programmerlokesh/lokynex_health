using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

/// <summary>A staff member (CEO, manager, marketing...) who works under the SuperAdmin.
/// Lives in platform.owners (UI name: "Staff"). Which console panels they may open
/// is decided by the SuperAdmin and stored in <see cref="Permissions"/>.</summary>
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

    /// <summary>"labs:manage,plans:view" — see StaffPanels in the Application layer.</summary>
    public string Permissions { get; set; } = "";
}