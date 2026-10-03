using MediatR;

namespace LokynexHealth.Application.Patients.Queries.SearchPatients;

public class SearchPatientsQuery : IRequest<List<PatientDto>>
{
    /// <summary>Phone prefix. At least 3 digits, otherwise an empty list is returned.</summary>
    public string? Phone { get; set; }
    public int Limit { get; set; } = 8;
}