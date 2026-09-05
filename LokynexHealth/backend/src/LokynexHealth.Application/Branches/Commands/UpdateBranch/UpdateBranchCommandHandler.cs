using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Branches.Commands.UpdateBranch;

public class UpdateBranchCommandHandler : IRequestHandler<UpdateBranchCommand>
{
    private readonly IApplicationDbContext _db;

    public UpdateBranchCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(UpdateBranchCommand request, CancellationToken cancellationToken)
    {
        var branch = await _db.Branches
            .FirstOrDefaultAsync(b => b.Id == request.Id, cancellationToken);

        if (branch is null)
            throw new NotFoundException(nameof(Branch), request.Id);

        // BranchCode ei jaygay touch kora hocche na — request e field ta already নাই,
        // tai accidentally overwrite howar risk-o nai. Eta e "immutable by design" pattern.
        branch.BranchName = request.BranchName;
        branch.BranchAddress = request.BranchAddress;
        branch.BranchPincode = request.BranchPincode;
        branch.BranchPhone = request.BranchPhone;
        branch.BranchEmail = request.BranchEmail;
        branch.Status = Enum.Parse<RecordStatus>(request.Status);
        branch.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
    }
}