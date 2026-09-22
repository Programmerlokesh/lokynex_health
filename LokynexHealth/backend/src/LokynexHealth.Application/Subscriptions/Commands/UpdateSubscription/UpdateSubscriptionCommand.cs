using MediatR;

namespace LokynexHealth.Application.Subscriptions.Commands.UpdateSubscription;

// Deliberately editable regardless of current Status — a SuperAdmin should be
// able to correct dates, the amount, or swap the plan on an already-Active
// subscription (e.g. a data-entry mistake, or a manual upgrade/downgrade),
// not just while it's still in some "draft" state.
public class UpdateSubscriptionCommand : IRequest
{
    public Guid Id { get; set; }
    public Guid PlanId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public decimal AmountPaid { get; set; }
    public string Status { get; set; } = "Active";
    public bool AutoRenew { get; set; }
}