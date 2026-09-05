using MediatR;

namespace LokynexHealth.Application.Subscriptions.Queries.GetSubscriptions;

public class GetSubscriptionsQuery : IRequest<List<SubscriptionDto>>
{
    public Guid? TenantId { get; set; }
}