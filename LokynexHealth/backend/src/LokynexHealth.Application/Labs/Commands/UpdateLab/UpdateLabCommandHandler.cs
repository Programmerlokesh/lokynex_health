using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Labs.Common;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Labs.Commands.UpdateLab;

public class UpdateLabCommandHandler : IRequestHandler<UpdateLabCommand, Unit>
{
    private readonly IApplicationDbContext _db;

    public UpdateLabCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Unit> Handle(UpdateLabCommand request, CancellationToken cancellationToken)
    {
        var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
        if (tenant is null)
            throw new NotFoundException("Lab", request.Id);

        tenant.PrimaryBranchName = request.PrimaryBranchName;
        tenant.PrimaryBranchAddress = request.PrimaryBranchAddress;
        tenant.PrimaryBranchPhone = request.PrimaryBranchPhone;
        tenant.PrimaryBranchEmail = request.PrimaryBranchEmail;
        tenant.PrimaryBranchPincode = request.PrimaryBranchPincode;

        tenant.AdminName = request.AdminName;
        tenant.AdminPhone = request.AdminPhone;
        tenant.AdminAddress = request.AdminAddress;
        tenant.AdminEmail = request.AdminEmail;

        if (!string.IsNullOrWhiteSpace(request.CompanyType))
            tenant.CompanyType = request.CompanyType.Trim();

        // Keep the operational "Main" branch row in lockstep with the tenant's
        // primary-branch fields (self-heals labs created before this row existed).
        var mainBranch = await _db.Branches.FirstOrDefaultAsync(b => b.Id == tenant.Id, cancellationToken);
        if (mainBranch is null)
        {
            var exists = await _db.Branches.AnyAsync(b => b.BranchCode == tenant.LabCode, cancellationToken);
            if (!exists)
                _db.Branches.Add(BranchMirror.BuildMainBranch(tenant));
        }
        else
        {
            mainBranch.BranchName = request.PrimaryBranchName;
            mainBranch.BranchAddress = request.PrimaryBranchAddress;
            mainBranch.BranchPhone = request.PrimaryBranchPhone;
            mainBranch.BranchEmail = request.PrimaryBranchEmail;
            mainBranch.BranchPincode = request.PrimaryBranchPincode;
            mainBranch.IsMain = true;
            mainBranch.UpdatedAt = DateTimeOffset.UtcNow;
        }

        tenant.UserLimit = request.UserLimit;
        tenant.Status = Enum.Parse<PlatformRecordStatus>(request.Status);
        tenant.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}