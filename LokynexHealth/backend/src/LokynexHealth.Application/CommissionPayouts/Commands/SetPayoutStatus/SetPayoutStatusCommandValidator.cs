using FluentValidation;

namespace LokynexHealth.Application.CommissionPayouts.Commands.SetPayoutStatus;

public class SetPayoutStatusCommandValidator : AbstractValidator<SetPayoutStatusCommand>
{
    public SetPayoutStatusCommandValidator()
    {
        RuleFor(x => x.PayoutIds).NotEmpty().Must(x => x.Count <= 5000)
            .WithMessage("Too many payouts selected at once.");
        RuleFor(x => x.Status)
            .Must(s => s != null && (s.Equals("Paid", StringComparison.OrdinalIgnoreCase)
                                     || s.Equals("Unpaid", StringComparison.OrdinalIgnoreCase)))
            .WithMessage("Status must be Paid or Unpaid.");
    }
}