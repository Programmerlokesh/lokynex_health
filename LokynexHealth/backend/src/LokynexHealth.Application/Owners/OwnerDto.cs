namespace LokynexHealth.Application.Owners;

public class OwnerDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string Role { get; set; } = default!;
    public string Username { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? WhatsappNumber { get; set; }
    public string? Address { get; set; }
    public string? Pincode { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public string Status { get; set; } = default!;
    public int LabCount { get; set; }
    public List<StaffPermissionDto> Permissions { get; set; } = new();
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}