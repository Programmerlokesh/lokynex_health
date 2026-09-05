using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using MediatR;

namespace LokynexHealth.Application.Ledger.Commands.RecordLedgerEntry;

public class RecordLedgerEntryCommandHandler : IRequestHandler<RecordLedgerEntryCommand, Guid>
{
    private readonly IApplicationDbContext _db;

    public RecordLedgerEntryCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Guid> Handle(RecordLedgerEntryCommand request, CancellationToken cancellationToken)
    {
        var entry = new LedgerEntry
        {
            Id = Guid.NewGuid(),
            BranchId = request.BranchId,
            EntryDate = request.EntryDate,
            EntryType = request.EntryType,
            Amount = request.Amount,
            Description = request.Description,
            CreatedBy = request.CreatedBy,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.LedgerEntries.Add(entry);
        await _db.SaveChangesAsync(cancellationToken);

        return entry.Id;
    }
}