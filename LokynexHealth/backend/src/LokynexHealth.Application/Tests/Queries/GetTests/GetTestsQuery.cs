using LokynexHealth.Application.Common.Models;
using MediatR;

namespace LokynexHealth.Application.Tests.Queries.GetTests;

public class GetTestsQuery : IRequest<PagedResult<TestDto>>
{
    public Guid? DepartmentId { get; set; }
    public string? Search { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}