using FluentValidation;

namespace LokynexHealth.Application.CommissionOverrides.Commands.SetCommissionOverride;

public class SetCommissionOverrideCommandValidator : AbstractValidator<SetCommissionOverrideCommand>
{
    public SetCommissionOverrideCommandValidator()
    {
        RuleFor(x => x.EntityType).Must(t => t is "Doctor" or "Referral" or "Technician")
            .WithMessage("EntityType must be Doctor, Referral, or Technician.");
        RuleFor(x => x.EntityId).NotEmpty();
        RuleFor(x => x.TestId).NotEmpty();
        RuleFor(x => x.CommissionType).Must(t => t is "Flat" or "Percentage");
        RuleFor(x => x.CommissionValue).GreaterThanOrEqualTo(0);
    }
}