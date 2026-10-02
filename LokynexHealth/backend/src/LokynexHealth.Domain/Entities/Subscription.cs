using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

public class Subscription : BaseEntity
{
    public Guid TenantId { get; set; }

    /// <summary>Null = the lab's main/primary subscription. Set = this
    /// subscription belongs to one specific branch (platform.tenant_branches),
    /// billed and renewed independently of the lab's main subscription.</summary>
    public Guid? BranchId { get; set; }
    public Guid PlanId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public SubscriptionStatusType Status { get; set; } = SubscriptionStatusType.Active;
    public decimal AmountPaid { get; set; }
    public bool AutoRenew { get; set; } = true;
}