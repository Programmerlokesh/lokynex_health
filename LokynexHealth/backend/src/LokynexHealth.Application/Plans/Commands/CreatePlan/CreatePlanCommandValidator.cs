using FluentValidation;

namespace LokynexHealth.Application.Plans.Commands.CreatePlan;

public class CreatePlanCommandValidator : AbstractValidator<CreatePlanCommand>
{
    public CreatePlanCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0);
        RuleFor(x => x.BillingCycle).Must(b => b is "Monthly" or "Quarterly" or "Yearly")
            .WithMessage("BillingCycle must be Monthly, Quarterly, or Yearly.");
        RuleFor(x => x.MaxUsers).GreaterThan(0);
        RuleFor(x => x.MaxBranches).GreaterThan(0);
    }
}