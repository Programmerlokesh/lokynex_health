using FluentValidation;

namespace LokynexHealth.Application.CommissionPayouts.Commands.MarkPayoutsPaid;

public class MarkPayoutsPaidCommandValidator : AbstractValidator<MarkPayoutsPaidCommand>
{
    public MarkPayoutsPaidCommandValidator()
    {
        RuleFor(x => x.PayoutIds).NotEmpty();
    }
}