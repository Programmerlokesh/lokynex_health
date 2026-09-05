using LokynexHealth.Application.Common.Models;
using MediatR;

namespace LokynexHealth.Application.Technicians.Queries.GetTechnicians;

public class GetTechniciansQuery : IRequest<PagedResult<TechnicianDto>>
{
    public Guid? BranchId { get; set; }
    public string? Search { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}