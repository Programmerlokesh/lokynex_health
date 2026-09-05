using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

public class CommissionOverride
{
    public Guid Id { get; set; }
    public CommissionEntityType EntityType { get; set; }
    public Guid? DoctorId { get; set; }
    public Guid? ReferralId { get; set; }
    public Guid? TechnicianId { get; set; }
    public Guid? DepartmentId { get; set; }
    public Guid TestId { get; set; }
    public Test Test { get; set; } = default!;
    public CommissionType CommissionType { get; set; }
    public decimal CommissionValue { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}