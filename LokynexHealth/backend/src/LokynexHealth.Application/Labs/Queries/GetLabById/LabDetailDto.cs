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
}