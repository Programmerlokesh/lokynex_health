using MediatR;

namespace LokynexHealth.Application.Doctors.Commands.UpdateDoctor;

public class UpdateDoctorCommand : IRequest
{
    public Guid Id { get; set; }   // set from the route
    public string FullName { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? Specialization { get; set; }
}