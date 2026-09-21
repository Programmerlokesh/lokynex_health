using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Labs.Commands.AddLabBranch;

public class AddLabBranchCommandHandler : IRequestHandler<AddLabBranchCommand, Guid>
{
    private readonly IApplicationDbContext _db;

    public AddLabBranchCommandHandler(IApplicationDbContext db)
    {
        _db = db;
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
        var codeTaken = await _db.TenantBranches
            .AnyAsync(b => b.TenantId == request.LabId && b.BranchCode == code, cancellationToken);

        if (codeTaken)
            throw new ConflictException($"Branch code '{code}' already exists for this lab.");

        var branch = new TenantBranch
        {
            Id = Guid.NewGuid(),
            TenantId = request.LabId,
            BranchName = request.BranchName.Trim(),
            BranchCode = code,
            BranchAddress = request.BranchAddress,
            BranchPincode = request.BranchPincode,
            BranchPhone = request.BranchPhone,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.TenantBranches.Add(branch);
        await _db.SaveChangesAsync(cancellationToken);

        return branch.Id;
    }
}