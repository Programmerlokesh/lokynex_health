using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Plans.Commands.UpdatePlan;

public class UpdatePlanCommandHandler : IRequestHandler<UpdatePlanCommand>
{
    private readonly IApplicationDbContext _db;

    public UpdatePlanCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(UpdatePlanCommand request, CancellationToken cancellationToken)
    {
        var plan = await _db.Plans.FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);
        if (plan is null)
            throw new NotFoundException(nameof(Plan), request.Id);

        plan.Name = request.Name;
        plan.Description = request.Description;
        plan.Price = request.Price;
        plan.BillingCycle = Enum.Parse<BillingCycleType>(request.BillingCycle);
        plan.MaxUsers = request.MaxUsers;
        plan.MaxBranches = request.MaxBranches;
        plan.IsActive = request.IsActive;

        await _db.SaveChangesAsync(cancellationToken);
    }
}