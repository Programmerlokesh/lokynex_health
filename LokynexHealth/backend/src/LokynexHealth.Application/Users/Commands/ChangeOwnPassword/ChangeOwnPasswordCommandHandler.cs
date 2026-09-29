using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Users.Commands.ChangeOwnPassword;

public class ChangeOwnPasswordCommandHandler : IRequestHandler<ChangeOwnPasswordCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _passwordHasher;

    public ChangeOwnPasswordCommandHandler(IApplicationDbContext db, IPasswordHasher passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;
    }

    public async Task Handle(ChangeOwnPasswordCommand request, CancellationToken cancellationToken)
    {
        // NOTE: a wrong current password is thrown as ConflictException (409),
        // NOT UnauthorizedException — the frontend's global 401 handler would
        // log the person out instead of showing "current password is wrong".
        if (request.IsTenantAdmin)
        {
            var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == request.UserId, cancellationToken);
            if (tenant is null)
                throw new NotFoundException(nameof(Domain.Entities.Tenant), request.UserId);

            if (!_passwordHasher.VerifyPassword(request.CurrentPassword, tenant.AdminPasswordHash))
                throw new ConflictException("Current password is incorrect.");

            tenant.AdminPasswordHash = _passwordHasher.HashPassword(request.NewPassword);
            await _db.SaveChangesAsync(cancellationToken);
            return;
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        if (user is null)
            throw new NotFoundException(nameof(Domain.Entities.User), request.UserId);

        if (!_passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
            throw new ConflictException("Current password is incorrect.");

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        user.UpdatedBy = request.UserId;
        await _db.SaveChangesAsync(cancellationToken);
    }
}