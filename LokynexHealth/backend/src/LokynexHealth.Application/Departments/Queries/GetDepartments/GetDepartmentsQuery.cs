using MediatR;

namespace LokynexHealth.Application.Departments.Queries.GetDepartments;

public class GetDepartmentsQuery : IRequest<List<DepartmentDto>>
{
}