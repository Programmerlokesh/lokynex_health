using MediatR;

namespace LokynexHealth.Application.Technicians.Commands.CreateTechnician;

public class CreateTechnicianCommand : IRequest<Guid>
{
    public Guid BranchId { get; set; }
    public string FullName { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? Email { get; set; }
    public string? Address { get; set; }
}