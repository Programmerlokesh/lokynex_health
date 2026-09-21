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
        var branch = await _db.TenantBranches
            .FirstOrDefaultAsync(
                b => b.Id == request.BranchId && b.TenantId == request.LabId,
                cancellationToken);

        if (branch is null)
            throw new NotFoundException("Branch", request.BranchId);

        _db.TenantBranches.Remove(branch);
        await _db.SaveChangesAsync(cancellationToken);
    }
}