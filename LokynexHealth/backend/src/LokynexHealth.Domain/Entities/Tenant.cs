using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

public class Tenant : BaseEntity
{
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
    public string AdminPasswordHash { get; set; } = default!;

    public int UserLimit { get; set; } = 5;
    public PlatformRecordStatus Status { get; set; } = PlatformRecordStatus.Active;
    public Guid? CreatedBy { get; set; }

    public ICollection<TenantBranch> ExtendBranches { get; set; } = new List<TenantBranch>();
}