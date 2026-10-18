using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

/// <summary>This lab's own version of a global referral (lives in the lab schema).</summary>
public class ReferralLabOverride
{
    public Guid ReferralId { get; set; }

    public bool HasEdits { get; set; }
    public string? FullName { get; set; }
    public string? Phone { get; set; }
    public string? WhatsappNumber { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }

    public PlatformRecordStatus? Status { get; set; }
    public bool IsHidden { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}