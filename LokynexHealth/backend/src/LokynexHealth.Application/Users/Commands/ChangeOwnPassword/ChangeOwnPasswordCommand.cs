using MediatR;

namespace LokynexHealth.Application.Users.Commands.ChangeOwnPassword;

// A LabAdmin changing THEIR OWN password. Requires the current password so a
// stolen/unattended session can't silently take over the account.
public class ChangeOwnPasswordCommand : IRequest
{
    public string CurrentPassword { get; set; } = default!;
    public string NewPassword { get; set; } = default!;

    // Both set by the controller from ICurrentUserService — never trusted
    // from the request body.
    public Guid UserId { get; set; }
    public bool IsTenantAdmin { get; set; }
}