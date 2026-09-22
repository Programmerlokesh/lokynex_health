using FluentValidation;

namespace LokynexHealth.Application.Subscriptions.Commands.UpdateSubscription;

public class UpdateSubscriptionCommandValidator : AbstractValidator<UpdateSubscriptionCommand>
{
    public UpdateSubscriptionCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.PlanId).NotEmpty();
        RuleFor(x => x.EndDate).GreaterThan(x => x.StartDate);
        RuleFor(x => x.AmountPaid).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Status).Must(s => s is "Trial" or "Active" or "Expired" or "Cancelled")
            .WithMessage("Status must be Trial, Active, Expired, or Cancelled.");
    }
}