using MediatR;

namespace LokynexHealth.Application.Doctors.Commands.CreateDoctor;

public class CreateDoctorCommand : IRequest<Guid>
{
    public string FullName { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? Specialization { get; set; }
}