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

    // ---- Soft delete (Deleted List) ----
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    /// <summary>Null when the Lab Admin (no row in `users`) deleted it.</summary>
    public Guid? DeletedBy { get; set; }
    public string? DeletedByName { get; set; }

    // ---- Who created / last edited. The NAME is stored too, because a Lab Admin has no `users` row. ----
    public Guid? CreatedBy { get; set; }
    public string? CreatedByName { get; set; }
    public Guid? UpdatedBy { get; set; }
    public string? UpdatedByName { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public ICollection<OrderPayment> Payments { get; set; } = new List<OrderPayment>();
    public ICollection<OrderAuditLog> AuditLogs { get; set; } = new List<OrderAuditLog>();
}