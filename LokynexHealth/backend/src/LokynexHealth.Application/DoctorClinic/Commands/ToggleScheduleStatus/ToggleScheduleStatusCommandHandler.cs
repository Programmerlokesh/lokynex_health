using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.DoctorClinic.Commands.ToggleScheduleStatus;

public class ToggleScheduleStatusCommandHandler : IRequestHandler<ToggleScheduleStatusCommand>
{
    private readonly IApplicationDbContext _db;

    public ToggleScheduleStatusCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(ToggleScheduleStatusCommand request, CancellationToken cancellationToken)
    {
        var schedule = await _db.DoctorClinicSchedules.FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        if (schedule is null)
            throw new NotFoundException(nameof(DoctorClinicSchedule), request.Id);

        schedule.IsActive = request.IsActive;
        schedule.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
    }
}