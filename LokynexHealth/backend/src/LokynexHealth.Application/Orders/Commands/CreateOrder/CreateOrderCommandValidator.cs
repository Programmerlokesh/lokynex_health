using FluentValidation;

namespace LokynexHealth.Application.Orders.Commands.CreateOrder;

public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.PatientPhone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.BranchId).NotEmpty();
        RuleFor(x => x.Items).NotEmpty().WithMessage("At least one test is required.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.TestId).NotEmpty();
            item.RuleFor(i => i)
                .Must(i => !(i.DoctorCommissionEnabled && i.ReferralCommissionEnabled))
                .WithMessage("Doctor and Referral commission cannot both be enabled on the same test line.");
        });

        RuleFor(x => x.DiscountValue).GreaterThanOrEqualTo(0);
        RuleFor(x => x.PaidAmount).GreaterThanOrEqualTo(0);
    }
}