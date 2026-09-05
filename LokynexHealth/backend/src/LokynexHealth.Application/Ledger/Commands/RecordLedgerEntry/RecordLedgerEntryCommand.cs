using MediatR;

namespace LokynexHealth.Application.Ledger.Commands.RecordLedgerEntry;

public class RecordLedgerEntryCommand : IRequest<Guid>
{
    public Guid? BranchId { get; set; }
    public DateOnly EntryDate { get; set; }
    public string EntryType { get; set; } = default!;
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public Guid? CreatedBy { get; set; }
}