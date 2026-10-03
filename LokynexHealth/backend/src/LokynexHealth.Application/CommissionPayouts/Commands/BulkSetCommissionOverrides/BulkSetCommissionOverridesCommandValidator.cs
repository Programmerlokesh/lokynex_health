using FluentValidation;

namespace LokynexHealth.Application.CommissionOverrides.Commands.BulkSetCommissionOverrides;

public class BulkSetCommissionOverridesCommandValidator : AbstractValidator<BulkSetCommissionOverridesCommand>
{
    public BulkSetCommissionOverridesCommandValidator()
    {
        RuleFor(x => x.EntityType).Must(t => t is "Doctor" or "Referral" or "Technician")
            .WithMessage("EntityType must be Doctor, Referral, or Technician.");
        RuleFor(x => x.EntityId).NotEmpty();
        RuleFor(x => x.DepartmentId).NotEmpty();
        RuleFor(x => x.Items)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Nothing to save.")
            .Must(i => i.Select(x => x.TestId).Distinct().Count() == i.Count)
            .WithMessage("The same test appears twice.");
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.TestId).NotEmpty();
            item.RuleFor(i => i.CommissionType).Must(t => t is "Flat" or "Percentage");
            item.RuleFor(i => i.CommissionValue).GreaterThanOrEqualTo(0);
        });
    }
}