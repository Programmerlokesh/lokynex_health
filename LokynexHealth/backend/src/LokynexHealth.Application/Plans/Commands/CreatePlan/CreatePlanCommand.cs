using MediatR;

namespace LokynexHealth.Application.Plans.Commands.CreatePlan;

public class CreatePlanCommand : IRequest<Guid>
{
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string BillingCycle { get; set; } = "Monthly";
    public int MaxUsers { get; set; }
    public int MaxBranches { get; set; }
}