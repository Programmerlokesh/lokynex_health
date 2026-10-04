using MediatR;

namespace LokynexHealth.Application.Departments.Commands.DeleteDepartment;

public class DeleteDepartmentCommand : IRequest
{
    public Guid Id { get; set; }
}