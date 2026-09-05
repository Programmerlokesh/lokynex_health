using MediatR;

namespace LokynexHealth.Application.DoctorClinic.Commands.ToggleScheduleStatus;

public class ToggleScheduleStatusCommand : IRequest
{
    public Guid Id { get; set; }
    public bool IsActive { get; set; }
}