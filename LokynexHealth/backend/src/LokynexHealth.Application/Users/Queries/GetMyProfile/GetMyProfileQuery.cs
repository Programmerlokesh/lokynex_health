using MediatR;

namespace LokynexHealth.Application.Users.Queries.GetMyProfile;

public class GetMyProfileQuery : IRequest<MyProfileDto>
{
    public Guid UserId { get; set; }

    // Set by the controller from ICurrentUserService.IsTenantAdmin. The
    // Tenant Admin (lab owner) account has no row in the tenant `users`
    // table — its "profile" lives in platform.tenants instead — so the
    // handler needs to know which table to read before it runs the query.
    public bool IsTenantAdmin { get; set; }
}

public class MyProfileDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string Username { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? Address { get; set; }
    public string? Pincode { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public string? RoleName { get; set; }
    public string? BranchName { get; set; }
}