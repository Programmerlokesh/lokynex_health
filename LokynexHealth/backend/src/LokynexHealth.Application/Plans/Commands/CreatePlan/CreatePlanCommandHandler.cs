using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;

namespace LokynexHealth.Application.Plans.Commands.CreatePlan;

public class CreatePlanCommandHandler : IRequestHandler<CreatePlanCommand, Guid>
{
    private readonly IApplicationDbContext _db;

    public CreatePlanCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Guid> Handle(CreatePlanCommand request, CancellationToken cancellationToken)
    {
        var plan = new Plan
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            BillingCycle = Enum.Parse<BillingCycleType>(request.BillingCycle),
            MaxUsers = request.MaxUsers,
            MaxBranches = request.MaxBranches,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.Plans.Add(plan);
        await _db.SaveChangesAsync(cancellationToken);
        return plan.Id;
    }
}