using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

public class Department : BaseEntity
{
    public string Name { get; set; } = default!;
    public RecordStatus Status { get; set; } = RecordStatus.Active;

    public ICollection<Test> Tests { get; set; } = new List<Test>();
}