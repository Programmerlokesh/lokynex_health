namespace LokynexHealth.Application.Plans.Queries.GetPlans;

public class PlanDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public decimal Price { get; set; }
    public string BillingCycle { get; set; } = default!;
    public int MaxUsers { get; set; }
    public int MaxBranches { get; set; }
    public bool IsActive { get; set; }
}