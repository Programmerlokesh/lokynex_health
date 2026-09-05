using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.DoctorClinic.Queries.GetSchedules;

public class GetSchedulesQueryHandler : IRequestHandler<GetSchedulesQuery, List<ScheduleDto>>
{
    private readonly IApplicationDbContext _db;

    public GetSchedulesQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<ScheduleDto>> Handle(GetSchedulesQuery request, CancellationToken cancellationToken)
    {
        var query = _db.DoctorClinicSchedules.Include(s => s.Branch).AsQueryable();

        if (request.BranchId.HasValue)
            query = query.Where(s => s.BranchId == request.BranchId.Value);

        if (request.DoctorId.HasValue)
            query = query.Where(s => s.DoctorId == request.DoctorId.Value);

        return await query
            .OrderBy(s => s.DayOfWeek).ThenBy(s => s.TimeFrom)
            .Select(s => new ScheduleDto
            {
                Id = s.Id,
                BranchId = s.BranchId,
                BranchName = s.Branch.BranchName,
                DoctorId = s.DoctorId,
                DayOfWeek = s.DayOfWeek,
                SlotMinutes = s.SlotMinutes,
                TimeFrom = s.TimeFrom,
                TimeTo = s.TimeTo,
                MaxPatients = s.MaxPatients,
                IsActive = s.IsActive
            })
            .ToListAsync(cancellationToken);
    }
}