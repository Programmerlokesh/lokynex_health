using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

public class CommissionPayout
{
    public Guid Id { get; set; }
    public CommissionEntityType EntityType { get; set; }
    public Guid? DoctorId { get; set; }
    public Guid? ReferralId { get; set; }
    public Guid? TechnicianId { get; set; }
    public Guid OrderItemId { get; set; }
    public OrderItem OrderItem { get; set; } = default!;
    public Guid? BranchId { get; set; }
    public decimal CommissionAmount { get; set; }
    public CommissionStatusType Status { get; set; } = CommissionStatusType.Unpaid;
    public DateTimeOffset? PaidAt { get; set; }
    public Guid? PaidBy { get; set; }
    public Guid? GeneratedBy { get; set; }
    public DateTimeOffset GeneratedAt { get; set; }
}