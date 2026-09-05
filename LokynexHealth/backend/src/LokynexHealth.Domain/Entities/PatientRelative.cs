using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

public class PatientRelative
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public Patient Patient { get; set; } = default!;
    public string Name { get; set; } = default!;
    public int? Age { get; set; }
    public string? Relationship { get; set; }
    public GenderType? Gender { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}