using LokynexHealth.Application.Common.Models;
using MediatR;

namespace LokynexHealth.Application.Doctors.Queries.GetDoctors;

public class GetDoctorsQuery : IRequest<PagedResult<DoctorDto>>
{
    public string? Search { get; set; }   // matches Name, Email, or Phone

    /// <summary>true = hide Inactive / Suspended doctors (for pickers where a doctor must be bookable).</summary>
    public bool ActiveOnly { get; set; }

    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}