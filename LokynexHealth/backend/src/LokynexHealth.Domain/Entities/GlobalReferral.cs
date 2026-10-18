using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

/// <summary>The shared registry row in platform.referrals. Only CREATED from the app.</summary>
public class GlobalReferral : BaseEntity
{
    public string FullName { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? WhatsappNumber { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public PlatformRecordStatus Status { get; set; } = PlatformRecordStatus.Active;
}