namespace LokynexHealth.Application.Subscriptions.Queries.GetSubscriptions;

public class SubscriptionDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string TenantName { get; set; } = default!;

    /// <summary>Null = the lab's main subscription.</summary>
    public Guid? BranchId { get; set; }

    /// <summary>Null when this is the lab's main subscription (BranchId is null).</summary>
    public string? BranchName { get; set; }
    public Guid PlanId { get; set; }
    public string PlanName { get; set; } = default!;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public decimal AmountPaid { get; set; }
    public bool AutoRenew { get; set; }
    public string Status { get; set; } = default!;
}