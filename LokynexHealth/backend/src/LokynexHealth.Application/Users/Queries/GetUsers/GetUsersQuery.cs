using LokynexHealth.Application.Common.Models;
using MediatR;

namespace LokynexHealth.Application.Users.Queries.GetUsers;

public class GetUsersQuery : IRequest<PagedResult<UserDto>>
{
    public string? Search { get; set; }
    public string? Status { get; set; }  // "All" | "Active" | "Inactive"
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}