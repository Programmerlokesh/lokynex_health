using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

public class Patient : BaseEntity
{
    public string PatientCode { get; set; } = default!;

    /// <summary>The guardian's name. The first person registered under a phone
    /// number is the family guardian; later family members live in
    /// <see cref="Relatives"/> with their relation to this person.</summary>
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = default!;
    public int? Age { get; set; }
    public GenderType? Gender { get; set; }
    public string? Address { get; set; }
    public string? Email { get; set; }
    public string? WhatsappNumber { get; set; }

    public ICollection<PatientRelative> Relatives { get; set; } = new List<PatientRelative>();
}