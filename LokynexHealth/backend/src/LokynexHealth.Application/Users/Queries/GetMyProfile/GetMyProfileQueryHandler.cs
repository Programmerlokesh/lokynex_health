using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Users.Queries.GetMyProfile;

public class GetMyProfileQueryHandler : IRequestHandler<GetMyProfileQuery, MyProfileDto>
{
    private readonly IApplicationDbContext _db;

    public GetMyProfileQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<MyProfileDto> Handle(GetMyProfileQuery request, CancellationToken cancellationToken)
    {
        // The Tenant Admin (lab owner) has no row in the tenant `users` table —
        // their account lives in platform.tenants (AdminName/AdminEmail/...),
        // created once at lab onboarding (see CreateLabCommandHandler). Looking
        // them up in `users` by UserId (which, for this token type, is actually
        // the tenant ID) always 404'd, which is why the Profile page/topbar
        // profile link previously did nothing useful for this account.
        if (request.IsTenantAdmin)
        {
            var tenant = await _db.Tenants
                .FirstOrDefaultAsync(t => t.Id == request.UserId, cancellationToken);

            if (tenant is null)
                throw new NotFoundException(nameof(Domain.Entities.Tenant), request.UserId);

            return new MyProfileDto
            {
                Id = tenant.Id,
                Name = tenant.AdminName,
                Username = tenant.AdminUsername,
                Email = tenant.AdminEmail,
                Phone = tenant.AdminPhone,
                Address = tenant.AdminAddress,
                Pincode = tenant.PrimaryBranchPincode,
                ProfilePictureUrl = tenant.AdminProfilePictureUrl,
                RoleName = "Lab Admin",
                BranchName = tenant.PrimaryBranchName
            };
        }

        var user = await _db.Users
            .Include(u => u.Role)
            .Include(u => u.Branch)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user is null)
            throw new NotFoundException(nameof(Domain.Entities.User), request.UserId);

        return new MyProfileDto
        {
            Id = user.Id,
            Name = user.Name,
            Username = user.Username,
            Email = user.Email,
            Phone = user.Phone,
            Address = user.Address,
            Pincode = user.Pincode,
            ProfilePictureUrl = user.ProfilePictureUrl,
            RoleName = user.Role?.Name,
            BranchName = user.Branch?.BranchName
        };
    }
}