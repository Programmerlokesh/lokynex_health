using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Users.Commands.UpdateOwnProfile;

public class UpdateOwnProfileCommandHandler : IRequestHandler<UpdateOwnProfileCommand>
{
    private readonly IApplicationDbContext _db;

    public UpdateOwnProfileCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(UpdateOwnProfileCommand request, CancellationToken cancellationToken)
    {
        // Tenant Admin has no `users` row — their profile fields live on
        // platform.tenants (see GetMyProfileQueryHandler for the read side of
        // this same split). Pincode/ProfilePictureUrl have no home on Tenant,
        // so they're accepted but silently ignored for this account type
        // rather than erroring.
        if (request.IsTenantAdmin)
        {
            var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == request.UserId, cancellationToken);
            if (tenant is null)
                throw new NotFoundException(nameof(Domain.Entities.Tenant), request.UserId);

            var tenantEmailTaken = await _db.Tenants
                .AnyAsync(t => t.Id != request.UserId && t.AdminEmail == request.Email, cancellationToken);
            if (tenantEmailTaken)
                throw new ConflictException($"Email '{request.Email}' already exists.");

            tenant.AdminName = request.Name;
            tenant.AdminEmail = request.Email;
            tenant.AdminPhone = request.Phone;
            tenant.AdminAddress = request.Address;

            await _db.SaveChangesAsync(cancellationToken);
            return;
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        if (user is null)
            throw new NotFoundException(nameof(Domain.Entities.User), request.UserId);

        var emailTaken = await _db.Users
            .AnyAsync(u => u.Id != request.UserId && u.Email == request.Email, cancellationToken);
        if (emailTaken)
            throw new ConflictException($"Email '{request.Email}' already exists.");

        // Deliberately does NOT touch: Username, PasswordHash, RoleId, BranchId,
        // Status, Permissions. A user editing their own profile can never grant
        // themselves a different role or reactivate a deactivated account.
        user.Name = request.Name;
        user.Email = request.Email;
        user.Phone = request.Phone;
        user.Address = request.Address;
        user.Pincode = request.Pincode;
        user.ProfilePictureUrl = request.ProfilePictureUrl;
        user.UpdatedBy = request.UserId;

        await _db.SaveChangesAsync(cancellationToken);
    }
}