using LokynexHealth.Application.Common.Models;
using MediatR;

namespace LokynexHealth.Application.Branches.Queries.GetBranches;

public class GetBranchesQuery : IRequest<PagedResult<BranchDto>>
{
    public string? Search { get; set; }
    public string? Status { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}