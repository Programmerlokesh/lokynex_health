namespace LokynexHealth.Domain.Entities;

public class TenantBranch
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = default!;
    public string BranchName { get; set; } = default!;
    public string BranchCode { get; set; } = default!;
    public string? BranchAddress { get; set; }
    public string? BranchPincode { get; set; }
    public string? BranchPhone { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}