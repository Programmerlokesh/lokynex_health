namespace LokynexHealth.Application.Patients.Queries.SearchPatients;

public class PatientDto
{
    public Guid Id { get; set; }
    public string PatientCode { get; set; } = default!;

    /// <summary>The family guardian (first person entered under this phone).</summary>
    public string FullName { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public int? Age { get; set; }
    public string? Gender { get; set; }
    public string? Address { get; set; }
    public string? Email { get; set; }

    public List<PatientRelativeDto> Relatives { get; set; } = new();
}

public class PatientRelativeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public int? Age { get; set; }
    public string? Gender { get; set; }

    /// <summary>Relation to the guardian, e.g. Wife, Son.</summary>
    public string? Relationship { get; set; }
}