using MediatR;

namespace LokynexHealth.Application.Users.Commands.DeleteUser;

// LabAdmin-only: permanently removes a lab user's account. Deliberately
// separate from ToggleUserStatus (Active/Inactive) — deactivating keeps the
// account and its order/audit history intact for compliance; this command
// erases the login itself and should be reserved for accounts created by
// mistake or duplicates, not for normal offboarding (use deactivate instead).
public class DeleteUserCommand : IRequest
{
    public Guid Id { get; set; }
    public Guid? PerformedBy { get; set; }
}