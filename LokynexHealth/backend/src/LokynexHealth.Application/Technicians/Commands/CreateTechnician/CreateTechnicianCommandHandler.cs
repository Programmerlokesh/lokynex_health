using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Technicians.Commands.CreateTechnician;

public class CreateTechnicianCommandHandler : IRequestHandler<CreateTechnicianCommand, Guid>
{
    private readonly IApplicationDbContext _db;

    public CreateTechnicianCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Guid> Handle(CreateTechnicianCommand request, CancellationToken cancellationToken)
    {
        var branchExists = await _db.Branches.AnyAsync(b => b.Id == request.BranchId, cancellationToken);
        if (!branchExists)
            throw new NotFoundException(nameof(Branch), request.BranchId);

        var technician = new Technician
        {
            Id = Guid.NewGuid(),
            BranchId = request.BranchId,
            FullName = request.FullName,
            Phone = request.Phone,
            Email = request.Email,
            Address = request.Address,
            Status = RecordStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.Technicians.Add(technician);
        await _db.SaveChangesAsync(cancellationToken);

        return technician.Id;
    }
}