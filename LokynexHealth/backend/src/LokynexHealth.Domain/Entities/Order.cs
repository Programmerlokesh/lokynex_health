using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

public class Order : BaseEntity
{
    public string OrderNumber { get; set; } = default!;
    public Guid PatientId { get; set; }
    public Patient Patient { get; set; } = default!;
    public Guid? RelativeId { get; set; }
    public PatientRelative? Relative { get; set; }
    public Guid BranchId { get; set; }
    public Branch Branch { get; set; } = default!;
    public Guid? DoctorId { get; set; }
    public Guid? ReferralId { get; set; }

    public DiscountType DiscountType { get; set; } = DiscountType.Flat;
    public decimal DiscountValue { get; set; }
    public decimal GrossAmount { get; set; }
    public decimal FinalAmount { get; set; }

    public bool IsComplimentary { get; set; }
    public PaymentMethodType? PaymentMethod { get; set; }
    public PaymentStatusType PaymentStatus { get; set; } = PaymentStatusType.Open;
    public decimal PaidAmount { get; set; }

    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
    public Guid CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}