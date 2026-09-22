using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Users.Commands.ResetUserPassword;

public class ResetUserPasswordCommandHandler : IRequestHandler<ResetUserPasswordCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _passwordHasher;

    public ResetUserPasswordCommandHandler(IApplicationDbContext db, IPasswordHasher passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;
    }

    public async Task Handle(ResetUserPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.TargetUserId, cancellationToken);
        if (user is null)
            throw new NotFoundException(nameof(Domain.Entities.User), request.TargetUserId);

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        user.UpdatedBy = request.PerformedBy;

        await _db.SaveChangesAsync(cancellationToken);
    }
}