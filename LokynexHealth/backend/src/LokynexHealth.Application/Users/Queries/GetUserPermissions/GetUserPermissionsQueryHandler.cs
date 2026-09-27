using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Users.Queries.GetUserPermissions;

public class GetUserPermissionsQueryHandler : IRequestHandler<GetUserPermissionsQuery, UserPermissionsDto>
{
    private readonly IApplicationDbContext _db;

    public GetUserPermissionsQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<UserPermissionsDto> Handle(GetUserPermissionsQuery request, CancellationToken cancellationToken)
    {
        var user = await _db.Users
            .Include(u => u.Permissions)
                .ThenInclude(p => p.Module)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user is null)
            throw new NotFoundException(nameof(Domain.Entities.User), request.UserId);

        // Every module is returned (not just ones the user already has a row
        // for) so the grid can render a full unchecked row for modules the
        // user has zero access to yet.
        var allModules = await _db.Modules.OrderBy(m => m.Id).ToListAsync(cancellationToken);
        var existing = user.Permissions.ToDictionary(p => p.ModuleId);

        var permissions = allModules.Select(m =>
        {
            existing.TryGetValue(m.Id, out var p);
            return new ModulePermissionDto
            {
                ModuleId = m.Id,
                ModuleName = m.Name,
                CanView = p?.CanView ?? false,
                CanCreate = p?.CanCreate ?? false,
                CanEdit = p?.CanEdit ?? false,
                CanDelete = p?.CanDelete ?? false
            };
        }).ToList();

        return new UserPermissionsDto
        {
            UserId = user.Id,
            RoleId = user.RoleId,
            Permissions = permissions
        };
    }
}