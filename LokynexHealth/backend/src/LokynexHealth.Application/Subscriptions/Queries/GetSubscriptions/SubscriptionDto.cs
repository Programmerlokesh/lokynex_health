namespace LokynexHealth.Application.Subscriptions.Queries.GetSubscriptions;

public class SubscriptionDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string TenantName { get; set; } = default!;
    public Guid PlanId { get; set; }
    public string PlanName { get; set; } = default!;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public decimal AmountPaid { get; set; }
    public bool AutoRenew { get; set; }
    public string Status { get; set; } = default!;
}