using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Users.Commands.UpdateUserPermissions;

public class UpdateUserPermissionsCommandHandler : IRequestHandler<UpdateUserPermissionsCommand>
{
    private readonly IApplicationDbContext _db;

    public UpdateUserPermissionsCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(UpdateUserPermissionsCommand request, CancellationToken cancellationToken)
    {
        var user = await _db.Users
            .Include(u => u.Permissions)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user is null)
            throw new NotFoundException(nameof(Domain.Entities.User), request.UserId);

        user.RoleId = request.RoleId;
        user.UpdatedBy = request.UpdatedBy;

        // Replace the whole permission set in one go — simplest correct model
        // for a grid the LabAdmin just submitted in full (no partial-patch UI).
        _db.UserModulePermissions.RemoveRange(user.Permissions);

        foreach (var perm in request.Permissions)
        {
            // Skip an all-false row instead of writing a dead 0/0/0/0 record —
            // "no access to this module" is represented by the row's absence.
            if (!perm.CanView && !perm.CanCreate && !perm.CanEdit && !perm.CanDelete)
                continue;

            _db.UserModulePermissions.Add(new UserModulePermission
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                ModuleId = perm.ModuleId,
                CanView = perm.CanView,
                CanCreate = perm.CanCreate,
                CanEdit = perm.CanEdit,
                CanDelete = perm.CanDelete
            });
        }

        await _db.SaveChangesAsync(cancellationToken);
    }
}