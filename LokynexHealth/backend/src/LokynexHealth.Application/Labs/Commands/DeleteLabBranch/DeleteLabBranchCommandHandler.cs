using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Labs.Commands.DeleteLabBranch;

public class DeleteLabBranchCommandHandler : IRequestHandler<DeleteLabBranchCommand>
{
    private readonly IApplicationDbContext _db;

    public DeleteLabBranchCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(DeleteLabBranchCommand request, CancellationToken cancellationToken)
    {
        // Matching on BOTH ids so a branch can never be deleted through a
        // different lab's URL by guessing the branch guid.
        var tenantBranch = await _db.TenantBranches
            .FirstOrDefaultAsync(
                b => b.Id == request.BranchId && b.TenantId == request.LabId,
                cancellationToken);

        if (tenantBranch is null)
            throw new NotFoundException("Branch", request.BranchId);

        // O(1) indexed existence check, not a full staff list — we only need
        // to know whether any row points at this branch.
        var hasStaff = await _db.Users
            .AnyAsync(u => u.BranchId == request.BranchId, cancellationToken);

        if (hasStaff)
            throw new ConflictException(
                "This branch has staff assigned to it. Reassign or remove them, " +
                "or set the branch to Inactive instead of deleting it.");

        // Any branch-specific subscription goes with it — a subscription
        // can't meaningfully outlive the branch it was billed for.
        var branchSubscriptions = await _db.Subscriptions
            .Where(s => s.BranchId == request.BranchId)
            .ToListAsync(cancellationToken);
        _db.Subscriptions.RemoveRange(branchSubscriptions);

        var operationalBranch = await _db.Branches
            .FirstOrDefaultAsync(b => b.Id == request.BranchId, cancellationToken);
        if (operationalBranch is not null)
            _db.Branches.Remove(operationalBranch);

        _db.TenantBranches.Remove(tenantBranch);
        await _db.SaveChangesAsync(cancellationToken);
    }
}