using FluentValidation;

namespace LokynexHealth.Application.Ledger.Commands.RecordLedgerEntry;

public class RecordLedgerEntryCommandValidator : AbstractValidator<RecordLedgerEntryCommand>
{
    private static readonly string[] ValidTypes = { "Income", "Expense", "CommissionPayout", "Refund" };

    public RecordLedgerEntryCommandValidator()
    {
        RuleFor(x => x.EntryType).Must(t => ValidTypes.Contains(t))
            .WithMessage($"EntryType must be one of: {string.Join(", ", ValidTypes)}");
        RuleFor(x => x.Amount).NotEqual(0).WithMessage("Amount cannot be zero.");
    }
}