namespace LokynexHealth.Application.Branches.Queries.GetBranches;

public class BranchDto
{
    public Guid Id { get; set; }
    public string BranchName { get; set; } = default!;
    public string BranchCode { get; set; } = default!;
    public string? BranchAddress { get; set; }
    public string? BranchPincode { get; set; }
    public string? BranchPhone { get; set; }
    public string? BranchEmail { get; set; }
    public bool CreatedBySuperAdmin { get; set; }
    public string Status { get; set; } = default!;
    public DateTimeOffset CreatedAt { get; set; }
}