using FluentValidation;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Ledger.Commands.UpdateLedgerEntry;

public class UpdateLedgerEntryCommand : IRequest<Guid>
{
    public Guid Id { get; set; }   // set from the route by the controller
    public Guid? BranchId { get; set; }
    public DateOnly EntryDate { get; set; }
    public string EntryType { get; set; } = default!;
    public decimal Amount { get; set; }
    public string? Description { get; set; }
}

public class UpdateLedgerEntryCommandValidator : AbstractValidator<UpdateLedgerEntryCommand>
{
    private static readonly string[] ValidTypes = { "Income", "Expense", "CommissionPayout", "Refund" };

    public UpdateLedgerEntryCommandValidator()
    {
        RuleFor(x => x.EntryType).Must(t => ValidTypes.Contains(t))
            .WithMessage($"EntryType must be one of: {string.Join(", ", ValidTypes)}");
        RuleFor(x => x.Amount).NotEqual(0).WithMessage("Amount cannot be zero.");
        RuleFor(x => x.Description).MaximumLength(500);
    }
}

public class UpdateLedgerEntryCommandHandler : IRequestHandler<UpdateLedgerEntryCommand, Guid>
{
    private readonly IApplicationDbContext _db;

    public UpdateLedgerEntryCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Guid> Handle(UpdateLedgerEntryCommand request, CancellationToken ct)
    {
        var entry = await _db.LedgerEntries.FirstOrDefaultAsync(l => l.Id == request.Id, ct)
            ?? throw new NotFoundException("Ledger entry", request.Id);

        if (entry.ReferenceTable != null)
            throw new ConflictException(
                "This entry was auto-synced from an order or commission payout. Edit the order / payout instead — the ledger follows it.");

        entry.BranchId = request.BranchId;
        entry.EntryDate = request.EntryDate;
        entry.EntryType = request.EntryType;
        entry.Amount = request.Amount;
        entry.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

        await _db.SaveChangesAsync(ct);
        return entry.Id;
    }
}