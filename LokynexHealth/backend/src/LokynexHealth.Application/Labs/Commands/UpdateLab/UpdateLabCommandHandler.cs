using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
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

        tenant.UserLimit = request.UserLimit;
        tenant.Status = Enum.Parse<PlatformRecordStatus>(request.Status);
        tenant.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}