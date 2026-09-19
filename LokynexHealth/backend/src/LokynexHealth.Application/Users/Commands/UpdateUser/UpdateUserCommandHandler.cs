using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Users.Commands.UpdateUser;

// Deliberately does NOT touch Username or Permissions — Username is treated as
// immutable (it's how the person logs in), and there's no real permission-grid
// UI yet (CreateUser only ever sets one hardcoded module), so silently wiping
// a user's existing permissions on every profile edit would be a destructive
// side effect nobody asked for. Editing permissions stays a separate concern.
public class UpdateUserCommandHandler : IRequestHandler<UpdateUserCommand>
{
    private readonly IApplicationDbContext _db;

    public UpdateUserCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);
        if (user is null)
            throw new NotFoundException(nameof(Domain.Entities.User), request.Id);

        var emailTaken = await _db.Users
            .AnyAsync(u => u.Id != request.Id && u.Email == request.Email, cancellationToken);
        if (emailTaken)
            throw new ConflictException($"Email '{request.Email}' already exists.");

        user.Name = request.Name;
        user.Email = request.Email;
        user.Phone = request.Phone;
        user.BranchId = request.BranchId;
        user.UpdatedBy = request.UpdatedBy;

        await _db.SaveChangesAsync(cancellationToken);
    }
}