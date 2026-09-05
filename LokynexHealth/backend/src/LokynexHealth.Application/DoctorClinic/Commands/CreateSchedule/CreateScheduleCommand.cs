using MediatR;

namespace LokynexHealth.Application.DoctorClinic.Commands.CreateSchedule;

public class CreateScheduleCommand : IRequest<Guid>
{
    public Guid BranchId { get; set; }
    public Guid DoctorId { get; set; }
    public short DayOfWeek { get; set; }
    public int SlotMinutes { get; set; }
    public TimeOnly TimeFrom { get; set; }
    public TimeOnly TimeTo { get; set; }
    public int MaxPatients { get; set; }
}