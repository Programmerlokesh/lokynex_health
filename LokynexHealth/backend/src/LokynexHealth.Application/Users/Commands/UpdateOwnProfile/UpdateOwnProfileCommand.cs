using MediatR;

namespace LokynexHealth.Application.Users.Commands.UpdateOwnProfile;

// A user editing THEIR OWN profile. Deliberately has no Password field, no
// RoleId, no Permissions, no BranchId — those are LabAdmin-only concerns
// (see UpdateUserCommand / ResetUserPasswordCommand). Username is also
// excluded: it's how the person logs in and stays immutable everywhere in
// this codebase, not just here.
public class UpdateOwnProfileCommand : IRequest
{
    public string Name { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? Address { get; set; }
    public string? Pincode { get; set; }
    public string? ProfilePictureUrl { get; set; }

    // Set by the controller from ICurrentUserService — never trusted from the
    // request body. This is what makes the command "self-service only": there
    // is no Id field a caller could point at someone else's account.
    public Guid UserId { get; set; }
}