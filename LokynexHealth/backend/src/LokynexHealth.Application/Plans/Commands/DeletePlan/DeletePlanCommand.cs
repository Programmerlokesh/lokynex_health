using MediatR;

namespace LokynexHealth.Application.Plans.Commands.DeletePlan;

public class DeletePlanCommand : IRequest
{
    public Guid Id { get; set; }
}