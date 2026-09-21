using LokynexHealth.Application.Labs.Common;

namespace LokynexHealth.Application.Labs.Queries.GetLabs;

public class LabDto
{
    public Guid Id { get; set; }
    public string LabCode { get; set; } = default!;
    public string PrimaryBranchName { get; set; } = default!;
    public string Subdomain { get; set; } = default!;
    public string AdminName { get; set; } = default!;
    public int UserLimit { get; set; }
    public string Status { get; set; } = default!;
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>Null when the lab has never been given a subscription.</summary>
    public LabSubscriptionSummary? Subscription { get; set; }
}