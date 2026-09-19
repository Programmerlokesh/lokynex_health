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

        var schedules = await query
            .OrderBy(s => s.DayOfWeek).ThenBy(s => s.TimeFrom)
            .Select(s => new
            {
                s.Id,
                s.BranchId,
                BranchName = s.Branch.BranchName,
                s.DoctorId,
                s.DayOfWeek,
                s.SlotMinutes,
                s.TimeFrom,
                s.TimeTo,
                s.MaxPatients,
                s.IsActive
            })
            .ToListAsync(cancellationToken);

        // DoctorId is a cross-schema reference (platform.doctors — no EF navigation),
        // so batch-fetch names in one query + Dictionary O(1) lookup, same pattern
        // used in GetCommissionOverridesQueryHandler / GetPayoutsQueryHandler.
        var doctorIds = schedules.Select(s => s.DoctorId).Distinct().ToList();
        var doctorNames = doctorIds.Count == 0
            ? new Dictionary<Guid, string>()
            : await _db.Doctors.Where(d => doctorIds.Contains(d.Id))
                .ToDictionaryAsync(d => d.Id, d => d.FullName, cancellationToken);

        return schedules.Select(s => new ScheduleDto
        {
            Id = s.Id,
            BranchId = s.BranchId,
            BranchName = s.BranchName,
            DoctorId = s.DoctorId,
            DoctorName = doctorNames.GetValueOrDefault(s.DoctorId, "Unknown"),
            DayOfWeek = s.DayOfWeek,
            SlotMinutes = s.SlotMinutes,
            TimeFrom = s.TimeFrom,
            TimeTo = s.TimeTo,
            MaxPatients = s.MaxPatients,
            IsActive = s.IsActive
        }).ToList();
    }
}