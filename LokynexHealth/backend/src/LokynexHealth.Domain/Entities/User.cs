using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

public class User : BaseEntity
{
    public string Name { get; set; } = default!;
    public string Username { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string Phone { get; set; } = default!;

    // Profile fields — editable by the user themselves via UpdateOwnProfile,
    // never via the password change path.
    public string? Address { get; set; }
    public string? Pincode { get; set; }
    public string? ProfilePictureUrl { get; set; }

    public Guid? BranchId { get; set; }
    public Branch? Branch { get; set; }

    public Guid? RoleId { get; set; }
    public Role? Role { get; set; }

    public string PasswordHash { get; set; } = default!;
    public RecordStatus Status { get; set; } = RecordStatus.Active;

    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation — ekটা User er onek permission entry thakte pare
    public ICollection<UserModulePermission> Permissions { get; set; } = new List<UserModulePermission>();
}