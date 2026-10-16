using MediatR;

namespace LokynexHealth.Application.Doctors.Commands.SetDoctorStatus;

public class SetDoctorStatusCommand : IRequest
{
    public Guid Id { get; set; }        // set from the route
    public bool IsActive { get; set; }  // true = Active, false = Inactive (deactivate)
}