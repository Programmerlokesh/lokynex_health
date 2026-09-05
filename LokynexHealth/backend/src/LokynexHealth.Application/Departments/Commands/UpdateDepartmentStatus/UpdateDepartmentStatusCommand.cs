using MediatR;

namespace LokynexHealth.Application.Departments.Commands.UpdateDepartmentStatus;

public class UpdateDepartmentStatusCommand : IRequest
{
    public Guid Id { get; set; }
    public string Status { get; set; } = default!;
}