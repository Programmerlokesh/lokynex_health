using MediatR;

namespace LokynexHealth.Application.Subscriptions.Queries.GetSubscriptions;

public class GetSubscriptionsQuery : IRequest<List<SubscriptionDto>>
{
    public Guid? TenantId { get; set; }

    /// <summary>Unset = no branch filtering. Set = only that branch's
    /// subscriptions. Pass an empty Guid to mean "main subscriptions only"
    /// is NOT supported here — use BranchId == null tenant-side filtering
    /// instead; this param exists for drilling into one specific branch.</summary>
    public Guid? BranchId { get; set; }
}