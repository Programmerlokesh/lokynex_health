using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

public class Branch : BaseEntity
{
    public string BranchName { get; set; } = default!;
    public string BranchCode { get; set; } = default!;
    public string? BranchAddress { get; set; }
    public string? BranchPincode { get; set; }
    public string? BranchPhone { get; set; }
    public string? BranchEmail { get; set; }
    public bool CreatedBySuperAdmin { get; set; }

    /// <summary>True for the lab's primary ("Main") branch. It is mirrored from
    /// platform.tenants into this table with Id == Tenant.Id so orders can
    /// reference it through the normal orders.branch_id foreign key.</summary>
    public bool IsMain { get; set; }
    public RecordStatus Status { get; set; } = RecordStatus.Active;
    public Guid? CreatedBy { get; set; }

    // Navigation — ekটা Branch e onek User thakte pare
    public ICollection<User> Users { get; set; } = new List<User>();
}