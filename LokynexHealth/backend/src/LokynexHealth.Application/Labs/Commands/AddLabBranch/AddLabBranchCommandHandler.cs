using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Labs.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Labs.Commands.AddLabBranch;

public class AddLabBranchCommandHandler : IRequestHandler<AddLabBranchCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public AddLabBranchCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(AddLabBranchCommand request, CancellationToken cancellationToken)
    {
        var tenantExists = await _db.Tenants
            .AnyAsync(t => t.Id == request.LabId, cancellationToken);

        if (!tenantExists)
            throw new NotFoundException("Lab", request.LabId);

        var code = request.BranchCode.Trim().ToUpperInvariant();

        // (tenant_id, branch_code) has a unique index in platform.tenant_branches,
        // so catch the clash here and return a readable 409 instead of letting
        // Postgres throw a raw constraint violation at SaveChanges.
        var codeTakenInRegistry = await _db.TenantBranches
            .AnyAsync(b => b.TenantId == request.LabId && b.BranchCode == code, cancellationToken);

        if (codeTakenInRegistry)
            throw new ConflictException($"Branch code '{code}' already exists for this lab.");

        // branches.branch_code is globally unique (one shared operational schema
        // today), so also guard against a code already used by ANY lab there —
        // otherwise SaveChanges fails with a raw Postgres unique-violation.
        var codeTakenOperationally = await _db.Branches
            .AnyAsync(b => b.BranchCode == code, cancellationToken);

        if (codeTakenOperationally)
            throw new ConflictException($"Branch code '{code}' is already in use.");

        var id = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;

        // Same Id on both rows — this is what lets UpdateLabBranch and
        // DeleteLabBranch find the operational row again later, and what lets
        // GetLabById join the two to show the branch's real Status/users.
        var tenantBranch = BranchMirror.BuildTenantBranch(
            id, request.LabId, request.BranchName.Trim(), code,
            request.BranchAddress, request.BranchPincode, request.BranchPhone, now);

        var operationalBranch = BranchMirror.BuildOperationalBranch(
            id, request.BranchName.Trim(), code,
            request.BranchAddress, request.BranchPincode, request.BranchPhone,
            _currentUser.UserId, now);

        _db.TenantBranches.Add(tenantBranch);
        _db.Branches.Add(operationalBranch);
        await _db.SaveChangesAsync(cancellationToken);

        return id;
    }
}