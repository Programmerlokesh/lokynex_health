using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

/// <summary>This lab's own version of a global doctor (lives in the lab schema).</summary>
public class DoctorLabOverride
{
    public Guid DoctorId { get; set; }

    /// <summary>True = the detail fields below are this lab's version of the doctor.</summary>
    public bool HasEdits { get; set; }
    public string? FullName { get; set; }
    public string? Phone { get; set; }
    public string? WhatsappNumber { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? Specialization { get; set; }

    /// <summary>null = follow the global status.</summary>
    public PlatformRecordStatus? Status { get; set; }

    /// <summary>True = removed from this lab's list only.</summary>
    public bool IsHidden { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}