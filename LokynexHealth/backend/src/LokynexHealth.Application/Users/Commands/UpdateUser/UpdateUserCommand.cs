using MediatR;

namespace LokynexHealth.Application.Users.Commands.UpdateUser;

public class UpdateUserCommand : IRequest
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public Guid? BranchId { get; set; }

    // Set by the controller from ICurrentUserService — never trusted from the request body.
    public Guid? UpdatedBy { get; set; }
}