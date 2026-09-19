using MediatR;

namespace LokynexHealth.Application.Users.Commands.ToggleUserStatus;

public class ToggleUserStatusCommand : IRequest
{
    public Guid Id { get; set; }
    public bool IsActive { get; set; }
    public Guid? UpdatedBy { get; set; }
}