using FluentValidation;

namespace LokynexHealth.Application.CommissionPayouts.Commands.GeneratePayouts;

public class GeneratePayoutsCommandValidator : AbstractValidator<GeneratePayoutsCommand>
{
    public GeneratePayoutsCommandValidator()
    {
        RuleFor(x => x.DateTo).GreaterThanOrEqualTo(x => x.DateFrom);
    }
}