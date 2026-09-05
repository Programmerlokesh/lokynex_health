using LokynexHealth.Application.Common.Models;
using MediatR;

namespace LokynexHealth.Application.Labs.Queries.GetLabs;

public class GetLabsQuery : IRequest<PagedResult<LabDto>>
{
    public string? Search { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}