using LokynexHealth.Application.Labs.Common;

namespace LokynexHealth.Application.Labs.Queries.GetLabById;

public class LabDetailDto
{
    public Guid Id { get; set; }
    public string LabCode { get; set; } = default!;
    public string SchemaName { get; set; } = default!;
    public string Subdomain { get; set; } = default!;

    public string PrimaryBranchName { get; set; } = default!;
    public string PrimaryBranchAddress { get; set; } = default!;
    public string PrimaryBranchPhone { get; set; } = default!;
    public string PrimaryBranchEmail { get; set; } = default!;
    public string PrimaryBranchPincode { get; set; } = default!;

    public string AdminName { get; set; } = default!;
    public string AdminPhone { get; set; } = default!;
    public string? AdminAddress { get; set; }
    public string AdminEmail { get; set; } = default!;
    public string AdminUsername { get; set; } = default!;

    public int UserLimit { get; set; }
    public string Status { get; set; } = default!;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }

    /// <summary>Null when the lab has never been given a subscription.</summary>
    public LabSubscriptionSummary? Subscription { get; set; }

    public List<BranchDto> ExtendBranches { get; set; } = new();
}

public class BranchDto
{
    public Guid Id { get; set; }
    public string BranchName { get; set; } = default!;
    public string BranchCode { get; set; } = default!;
    public string? BranchAddress { get; set; }
    public string? BranchPincode { get; set; }
    public string? BranchPhone { get; set; }

    /// <summary>"Active"/"Inactive", read from the mirrored lab_demo.branches
    /// row. Null only for pre-sync legacy rows that haven't been edited yet.</summary>
    public string? Status { get; set; }

    /// <summary>This branch's OWN subscription — independent of the lab's
    /// main Subscription above. Null if this branch has never been billed
    /// separately (it's still covered by the lab's main plan).</summary>
    public LabSubscriptionSummary? Subscription { get; set; }
}