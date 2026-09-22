using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Plans.Commands.DeletePlan;

public class DeletePlanCommandHandler : IRequestHandler<DeletePlanCommand>
{
    private readonly IApplicationDbContext _db;

    public DeletePlanCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(DeletePlanCommand request, CancellationToken cancellationToken)
    {
        var plan = await _db.Plans.FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);
        if (plan is null)
            throw new NotFoundException(nameof(Plan), request.Id);

        // A plan that any subscription (past or present) points to can't be hard
        // deleted without either breaking that history or requiring a cascade —
        // neither of which a SuperAdmin clicking "Delete" should trigger silently.
        // Deactivating instead keeps the plan around for existing subscriptions
        // to display correctly, while hiding it from GetPlansQueryHandler's
        // "WHERE is_active = true" list so it can't be assigned to anyone new.
        var hasSubscriptions = await _db.Subscriptions.AnyAsync(s => s.PlanId == request.Id, cancellationToken);

        if (hasSubscriptions)
        {
            plan.IsActive = false;
            await _db.SaveChangesAsync(cancellationToken);
            return;
        }

        _db.Plans.Remove(plan);
        await _db.SaveChangesAsync(cancellationToken);
    }
}