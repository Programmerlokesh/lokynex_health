using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Users.Queries.GetUsers;

public class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, PagedResult<UserDto>>
{
    private readonly IApplicationDbContext _db;

    public GetUsersQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<UserDto>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        var query = _db.Users
            .Include(u => u.Branch)
            .Include(u => u.Role)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var searchTerm = $"%{request.Search}%";
            query = query.Where(u =>
                EF.Functions.ILike(u.Name, searchTerm) ||
                EF.Functions.ILike(u.Username, searchTerm) ||
                EF.Functions.ILike(u.Email, searchTerm) ||
                EF.Functions.ILike(u.Phone, searchTerm));
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && request.Status != "All")
        {
            if (Enum.TryParse<RecordStatus>(request.Status, out var statusEnum))
            {
                var statusText = statusEnum.ToString();
                query = query.Where(u => u.Status.ToString() == statusText);
            }
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Name = u.Name,
                Username = u.Username,
                Email = u.Email,
                Phone = u.Phone,
                BranchName = u.Branch != null ? u.Branch.BranchName : null,
                RoleName = u.Role != null ? u.Role.Name : null,
                Status = u.Status.ToString(),
                CreatedAt = u.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<UserDto>
        {
            Items = users,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}