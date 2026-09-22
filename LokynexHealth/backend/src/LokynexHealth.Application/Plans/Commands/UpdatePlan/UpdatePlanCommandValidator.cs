using FluentValidation;

namespace LokynexHealth.Application.Plans.Commands.UpdatePlan;

public class UpdatePlanCommandValidator : AbstractValidator<UpdatePlanCommand>
{
    public UpdatePlanCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0);
        RuleFor(x => x.BillingCycle).Must(b => b is "Monthly" or "Quarterly" or "Yearly")
            .WithMessage("BillingCycle must be Monthly, Quarterly, or Yearly.");
        RuleFor(x => x.MaxUsers).GreaterThan(0);
        RuleFor(x => x.MaxBranches).GreaterThan(0);
    }
}