using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

/// <summary>
/// READ-ONLY: this lab's view of a referral (global record + this lab's overrides),
/// mapped to the tenant view "referrals_effective". Never Add/Update/Remove through it —
/// use GlobalReferral (create) or ReferralLabOverride (edit / status / delete).
/// </summary>
public class Referral : BaseEntity
{
    public string FullName { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? WhatsappNumber { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public PlatformRecordStatus Status { get; set; } = PlatformRecordStatus.Active;

    /// <summary>True when this lab removed the referral from its own list.</summary>
    public bool IsHidden { get; set; }
}