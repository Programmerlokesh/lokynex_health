using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

public class Test : BaseEntity
{
    public Guid DepartmentId { get; set; }
    public Department Department { get; set; } = default!;

    public string Name { get; set; } = default!;
    public decimal Price { get; set; }

    public CommissionType DoctorCommissionType { get; set; } = CommissionType.Flat;
    public decimal DoctorCommissionValue { get; set; }

    public CommissionType ReferralCommissionType { get; set; } = CommissionType.Flat;
    public decimal ReferralCommissionValue { get; set; }

    public CommissionType TechnicianCommissionType { get; set; } = CommissionType.Flat;
    public decimal TechnicianCommissionValue { get; set; }

    public RecordStatus Status { get; set; } = RecordStatus.Active;
}