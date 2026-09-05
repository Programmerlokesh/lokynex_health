using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.DoctorClinic.Commands.CreateSchedule;

public class CreateScheduleCommandHandler : IRequestHandler<CreateScheduleCommand, Guid>
{
    private readonly IApplicationDbContext _db;

    public CreateScheduleCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Guid> Handle(CreateScheduleCommand request, CancellationToken cancellationToken)
    {
        var branchExists = await _db.Branches.AnyAsync(b => b.Id == request.BranchId, cancellationToken);
        if (!branchExists) throw new NotFoundException(nameof(Branch), request.BranchId);

        var doctorExists = await _db.Doctors.AnyAsync(d => d.Id == request.DoctorId, cancellationToken);
        if (!doctorExists) throw new NotFoundException(nameof(Doctor), request.DoctorId);

        var schedule = new DoctorClinicSchedule
        {
            Id = Guid.NewGuid(),
            BranchId = request.BranchId,
            DoctorId = request.DoctorId,
            DayOfWeek = request.DayOfWeek,
            SlotMinutes = request.SlotMinutes,
            TimeFrom = request.TimeFrom,
            TimeTo = request.TimeTo,
            MaxPatients = request.MaxPatients,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.DoctorClinicSchedules.Add(schedule);
        await _db.SaveChangesAsync(cancellationToken);

        return schedule.Id;
    }
}