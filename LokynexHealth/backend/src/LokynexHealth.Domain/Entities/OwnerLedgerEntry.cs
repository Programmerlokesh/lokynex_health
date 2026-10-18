namespace LokynexHealth.Domain.Entities;

/// <summary>Manual ledger row of an owner. Amount is ALWAYS positive; EntryType
/// (Income | Expense | Refund | CommissionPayout) decides the sign.</summary>
public class OwnerLedgerEntry : BaseEntity
{
    public Guid OwnerId { get; set; }
    public DateOnly EntryDate { get; set; }
    public string EntryType { get; set; } = default!;
    public string? Category { get; set; }
    public Guid? TenantId { get; set; }
    public decimal Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? ReferenceNo { get; set; }
    public string? Description { get; set; }
}