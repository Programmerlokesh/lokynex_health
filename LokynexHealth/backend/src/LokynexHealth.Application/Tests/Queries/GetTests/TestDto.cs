namespace LokynexHealth.Application.Tests.Queries.GetTests;

public class TestDto
{
    public Guid Id { get; set; }
    public Guid DepartmentId { get; set; }
    public string DepartmentName { get; set; } = default!;
    public string Name { get; set; } = default!;
    public decimal Price { get; set; }
    public string DoctorCommissionType { get; set; } = default!;
    public decimal DoctorCommissionValue { get; set; }
    public string ReferralCommissionType { get; set; } = default!;
    public decimal ReferralCommissionValue { get; set; }
    public string TechnicianCommissionType { get; set; } = default!;
    public decimal TechnicianCommissionValue { get; set; }
    public string Status { get; set; } = default!;
}