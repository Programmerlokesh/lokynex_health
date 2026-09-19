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

        // Compare enum-to-enum directly — NEVER u.Status.ToString() == someString.
        // That gets translated to SQL and breaks native Postgres enums (the same
        // recurring bug fixed across every other module in this codebase).
        if (!string.IsNullOrWhiteSpace(request.Status) && request.Status != "All")
        {
            if (Enum.TryParse<RecordStatus>(request.Status, out var statusEnum))
            {
                query = query.Where(u => u.Status == statusEnum);
            }
        }

        var totalCount = await query.CountAsync(cancellationToken);

        // Materialize FIRST — then map Status.ToString() in memory (LINQ-to-Objects),
        // never inside a .Select() that runs before .ToListAsync().
        var userEntities = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var users = userEntities.Select(u => new UserDto
        {
            Id = u.Id,
            Name = u.Name,
            Username = u.Username,
            Email = u.Email,
            Phone = u.Phone,
            BranchId = u.BranchId,
            BranchName = u.Branch != null ? u.Branch.BranchName : null,
            RoleName = u.Role != null ? u.Role.Name : null,
            Status = u.Status.ToString(),
            CreatedAt = u.CreatedAt
        }).ToList();

        return new PagedResult<UserDto>
        {
            Items = users,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}