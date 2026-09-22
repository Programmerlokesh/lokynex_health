using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Users.Commands.DeleteUser;

public class DeleteUserCommandHandler : IRequestHandler<DeleteUserCommand>
{
    private readonly IApplicationDbContext _db;

    public DeleteUserCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(DeleteUserCommand request, CancellationToken cancellationToken)
    {
        // Guard: a LabAdmin can't delete their own logged-in account — same
        // reasoning as ToggleUserStatus's self-deactivate guard (would lock
        // the lab out with no one left able to undo it).
        if (request.Id == request.PerformedBy)
            throw new ConflictException("You cannot delete your own account.");

        var user = await _db.Users
            .Include(u => u.Permissions)
            .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);
        if (user is null)
            throw new NotFoundException(nameof(Domain.Entities.User), request.Id);

        // Clear permission rows first — no ON DELETE CASCADE assumed on
        // user_module_permissions.user_id, so this avoids a raw FK violation
        // bubbling up as an unhandled 500 instead of a clean delete.
        _db.UserModulePermissions.RemoveRange(user.Permissions);
        _db.Users.Remove(user);

        await _db.SaveChangesAsync(cancellationToken);
    }
}