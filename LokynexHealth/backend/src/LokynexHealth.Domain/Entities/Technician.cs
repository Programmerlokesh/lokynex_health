using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

public class Technician : BaseEntity
{
    public Guid BranchId { get; set; }
    public Branch Branch { get; set; } = default!;
    public string FullName { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public RecordStatus Status { get; set; } = RecordStatus.Active;
}