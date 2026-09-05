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
    public RecordStatus Status { get; set; } = RecordStatus.Active;
    public Guid? CreatedBy { get; set; }

    // Navigation — ekটা Branch e onek User thakte pare
    public ICollection<User> Users { get; set; } = new List<User>();
}