using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

public class Patient : BaseEntity
{
    public string PatientCode { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public int? Age { get; set; }
    public GenderType? Gender { get; set; }
    public string? Address { get; set; }
    public string? Email { get; set; }
    public string? WhatsappNumber { get; set; }

    public ICollection<PatientRelative> Relatives { get; set; } = new List<PatientRelative>();
}