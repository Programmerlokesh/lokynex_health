using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Labs.Common;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Labs.Commands.UpdateLabBranch;

public class UpdateLabBranchCommandHandler : IRequestHandler<UpdateLabBranchCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public UpdateLabBranchCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(UpdateLabBranchCommand request, CancellationToken cancellationToken)
    {
        // Matching on BOTH ids so a branch can never be edited through a
        // different lab's URL by guessing the branch guid.
        var tenantBranch = await _db.TenantBranches
            .FirstOrDefaultAsync(
                b => b.Id == request.BranchId && b.TenantId == request.LabId,
                cancellationToken);

        if (tenantBranch is null)
            throw new NotFoundException("Branch", request.BranchId);

        var name = request.BranchName.Trim();
        var status = Enum.Parse<RecordStatus>(request.Status);

        tenantBranch.BranchName = name;
        tenantBranch.BranchAddress = request.BranchAddress;
        tenantBranch.BranchPincode = request.BranchPincode;
        tenantBranch.BranchPhone = request.BranchPhone;

        var operationalBranch = await _db.Branches
            .FirstOrDefaultAsync(b => b.Id == request.BranchId, cancellationToken);

        if (operationalBranch is null)
        {
            // Self-heal: this branch was created before the two tables were
            // kept in sync, so the operational row never existed. Create it
            // now instead of failing the edit.
            operationalBranch = BranchMirror.BuildOperationalBranch(
                tenantBranch.Id, name, tenantBranch.BranchCode,
                request.BranchAddress, request.BranchPincode, request.BranchPhone,
                _currentUser.UserId, DateTimeOffset.UtcNow);
            operationalBranch.Status = status;
            _db.Branches.Add(operationalBranch);
        }
        else
        {
            operationalBranch.BranchName = name;
            operationalBranch.BranchAddress = request.BranchAddress;
            operationalBranch.BranchPincode = request.BranchPincode;
            operationalBranch.BranchPhone = request.BranchPhone;
            operationalBranch.Status = status;
            operationalBranch.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await _db.SaveChangesAsync(cancellationToken);
    }
}