using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

public class Plan : BaseEntity
{
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public BillingCycleType BillingCycle { get; set; } = BillingCycleType.Monthly;
    public int MaxUsers { get; set; }
    public int MaxBranches { get; set; }
    public string? FeaturesJson { get; set; }
    public bool IsActive { get; set; } = true;
}