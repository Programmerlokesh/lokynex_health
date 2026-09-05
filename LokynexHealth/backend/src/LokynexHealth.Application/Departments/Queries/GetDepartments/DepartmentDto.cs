namespace LokynexHealth.Application.Departments.Queries.GetDepartments;

public class DepartmentDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string Status { get; set; } = default!;
    public int TestCount { get; set; }
}