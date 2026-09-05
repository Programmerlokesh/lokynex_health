using MediatR;

namespace LokynexHealth.Application.DoctorClinic.Queries.GetAvailableSlots;

public class GetAvailableSlotsQuery : IRequest<List<AvailableSlotDto>>
{
    public Guid DoctorId { get; set; }
    public Guid BranchId { get; set; }
    public DateOnly Date { get; set; }
}