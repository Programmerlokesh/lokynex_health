using MediatR;

namespace LokynexHealth.Application.Departments.Commands.CreateDepartment;

public class CreateDepartmentCommand : IRequest<Guid>
{
    public string Name { get; set; } = default!;
}