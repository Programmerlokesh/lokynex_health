using FluentValidation;
using LokynexHealth.Application.Common;

namespace LokynexHealth.Application.Orders.Commands.CreateOrder;

public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    private static readonly HashSet<string> Methods = new(StringComparer.OrdinalIgnoreCase) { "Cash", "Card", "UPI" };

    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.PatientPhone)
            .NotEmpty()
            .Must(p => PhoneNormalizer.Normalize(p).Length is >= 6 and <= 20)
            .WithMessage("Enter a valid patient phone number.");

        RuleFor(x => x.PatientName).MaximumLength(150);
        RuleFor(x => x.RelativeName).MaximumLength(150);
        RuleFor(x => x.RelativeRelationship).MaximumLength(50);
        RuleFor(x => x.PatientAge).InclusiveBetween(0, 130).When(x => x.PatientAge.HasValue);
        RuleFor(x => x.RelativeAge).InclusiveBetween(0, 130).When(x => x.RelativeAge.HasValue);

        RuleFor(x => x.RelativeRelationship)
            .NotEmpty()
            .When(x => !string.IsNullOrWhiteSpace(x.RelativeName))
            .WithMessage("Relation with the guardian is required for a family member.");

        RuleFor(x => x.BranchId).NotEmpty();
        RuleFor(x => x.Items).NotEmpty().WithMessage("At least one test is required.");

        RuleFor(x => x.Items)
            .Must(items => items.Select(i => i.TestId).Distinct().Count() == items.Count)
            .WithMessage("The same test cannot be added twice.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.TestId).NotEmpty();
            item.RuleFor(i => i)
                .Must(i => !(i.DoctorCommissionEnabled && i.ReferralCommissionEnabled))
                .WithMessage("Doctor and Referral commission cannot both be enabled on the same test line.");
        });

        RuleFor(x => x.DiscountValue).GreaterThanOrEqualTo(0);
        RuleFor(x => x.PaidAmount).GreaterThanOrEqualTo(0);

        RuleForEach(x => x.Payments).ChildRules(p =>
        {
            p.RuleFor(i => i.Method).Must(m => Methods.Contains(m ?? string.Empty))
                .WithMessage("Payment method must be Cash, Card or UPI.");
            p.RuleFor(i => i.Amount).GreaterThan(0).WithMessage("Each payment amount must be greater than zero.");
        });
    }
}