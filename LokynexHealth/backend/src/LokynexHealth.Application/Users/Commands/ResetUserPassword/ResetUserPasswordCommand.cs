using MediatR;

namespace LokynexHealth.Application.Users.Commands.ResetUserPassword;

// LabAdmin-only: sets a NEW password for some other user's account. This is
// the ONLY way a lab user's password ever changes — there is deliberately no
// "change my own password" endpoint. See UpdateOwnProfileCommand, which
// excludes the password field entirely.
public class ResetUserPasswordCommand : IRequest
{
    public Guid TargetUserId { get; set; }
    public string NewPassword { get; set; } = default!;

    // Set by the controller from ICurrentUserService — never trusted from the
    // request body.
    public Guid? PerformedBy { get; set; }
}