using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Doctors.Commands.SetDoctorStatus;

public class SetDoctorStatusCommandHandler : IRequestHandler<SetDoctorStatusCommand>
{
    private readonly IApplicationDbContext _db;

    public SetDoctorStatusCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(SetDoctorStatusCommand request, CancellationToken cancellationToken)
    {
        var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Doctor), request.Id);

        doctor.Status = request.IsActive ? PlatformRecordStatus.Active : PlatformRecordStatus.Inactive;
        doctor.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
    }
}