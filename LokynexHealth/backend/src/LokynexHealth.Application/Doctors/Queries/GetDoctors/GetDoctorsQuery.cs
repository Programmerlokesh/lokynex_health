using LokynexHealth.Application.Common.Models;
using MediatR;

namespace LokynexHealth.Application.Doctors.Queries.GetDoctors;

public class GetDoctorsQuery : IRequest<PagedResult<DoctorDto>>
{
    public string? Search { get; set; }   // matches Name, Email, or Phone
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}