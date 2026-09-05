using MediatR;

namespace LokynexHealth.Application.Subscriptions.Commands.CreateSubscription;

public class CreateSubscriptionCommand : IRequest<Guid>
{
    public Guid TenantId { get; set; }
    public Guid PlanId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public decimal AmountPaid { get; set; }
}