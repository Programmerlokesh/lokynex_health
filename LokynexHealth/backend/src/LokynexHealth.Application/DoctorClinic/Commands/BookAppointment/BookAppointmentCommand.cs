using MediatR;

namespace LokynexHealth.Application.DoctorClinic.Commands.BookAppointment;

public class BookAppointmentCommand : IRequest<Guid>
{
    public Guid DoctorId { get; set; }
    public Guid BranchId { get; set; }
    public DateOnly BookingDate { get; set; }
    public TimeOnly TimeSlot { get; set; }
    public string PatientName { get; set; } = default!;
    public string PatientPhone { get; set; } = default!;
    public string? PatientEmail { get; set; }
    public string? Note { get; set; }
}