namespace LokynexHealth.Domain.Entities;

public class LedgerEntry
{
    public Guid Id { get; set; }
    public Guid? BranchId { get; set; }
    public DateOnly EntryDate { get; set; }
    public string EntryType { get; set; } = default!;   // Income | Expense | CommissionPayout | Refund
    public string? ReferenceTable { get; set; }
    public Guid? ReferenceId { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}