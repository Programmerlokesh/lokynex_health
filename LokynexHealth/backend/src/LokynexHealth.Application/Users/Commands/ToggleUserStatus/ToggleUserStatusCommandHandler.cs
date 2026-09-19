using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Users.Commands.ToggleUserStatus;

public class ToggleUserStatusCommandHandler : IRequestHandler<ToggleUserStatusCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public ToggleUserStatusCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(ToggleUserStatusCommand request, CancellationToken cancellationToken)
    {
        // Guard: a user can't deactivate their own logged-in account (would lock
        // them out with no one able to undo it if they're the only admin online).
        if (request.Id == _currentUser.UserId && !request.IsActive)
            throw new ConflictException("You cannot deactivate your own account.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);
        if (user is null)
            throw new NotFoundException(nameof(Domain.Entities.User), request.Id);

        user.Status = request.IsActive ? RecordStatus.Active : RecordStatus.Inactive;
        user.UpdatedBy = request.UpdatedBy;

        await _db.SaveChangesAsync(cancellationToken);
    }
}