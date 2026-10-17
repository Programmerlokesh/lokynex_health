using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Ledger.Commands.DeleteLedgerEntry;

public class DeleteLedgerEntryCommand : IRequest<Guid>
{
    public Guid Id { get; set; }
}

public class DeleteLedgerEntryCommandHandler : IRequestHandler<DeleteLedgerEntryCommand, Guid>
{
    private readonly IApplicationDbContext _db;

    public DeleteLedgerEntryCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Guid> Handle(DeleteLedgerEntryCommand request, CancellationToken ct)
    {
        var entry = await _db.LedgerEntries.FirstOrDefaultAsync(l => l.Id == request.Id, ct)
            ?? throw new NotFoundException("Ledger entry", request.Id);

        if (entry.ReferenceTable != null)
            throw new ConflictException(
                "Auto-synced entries cannot be deleted here. They are removed automatically when the order is deleted.");

        _db.LedgerEntries.Remove(entry);
        await _db.SaveChangesAsync(ct);
        return request.Id;
    }
}