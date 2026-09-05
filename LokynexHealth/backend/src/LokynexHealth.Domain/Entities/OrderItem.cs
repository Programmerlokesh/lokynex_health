using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

public class OrderItem
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = default!;
    public Guid TestId { get; set; }
    public Test Test { get; set; } = default!;
    public Guid? TechnicianId { get; set; }

    public decimal Price { get; set; }

    public bool DoctorCommissionEnabled { get; set; }
    public decimal DoctorCommissionAmount { get; set; }
    public bool ReferralCommissionEnabled { get; set; }
    public decimal ReferralCommissionAmount { get; set; }
    public decimal TechnicianCommissionAmount { get; set; }

    public ReportStatusType ReportStatus { get; set; } = ReportStatusType.Pending;
    public DateTimeOffset CreatedAt { get; set; }
}