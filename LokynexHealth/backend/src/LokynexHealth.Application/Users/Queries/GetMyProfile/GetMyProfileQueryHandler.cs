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