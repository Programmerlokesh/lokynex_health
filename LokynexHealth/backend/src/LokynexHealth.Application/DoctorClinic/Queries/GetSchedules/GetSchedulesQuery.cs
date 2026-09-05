using MediatR;

namespace LokynexHealth.Application.DoctorClinic.Queries.GetSchedules;

public class GetSchedulesQuery : IRequest<List<ScheduleDto>>
{
    public Guid? BranchId { get; set; }
    public Guid? DoctorId { get; set; }
}