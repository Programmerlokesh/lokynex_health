using MediatR;

namespace LokynexHealth.Application.Plans.Queries.GetPlans;

public class GetPlansQuery : IRequest<List<PlanDto>> { }