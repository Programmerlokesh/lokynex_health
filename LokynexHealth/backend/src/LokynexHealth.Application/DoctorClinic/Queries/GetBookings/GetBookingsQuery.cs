using MediatR;

namespace LokynexHealth.Application.DoctorClinic.Queries.GetBookings;

public class GetBookingsQuery : IRequest<List<BookingDto>>
{
    public Guid DoctorId { get; set; }
    public DateOnly Date { get; set; }

    /// <summary>Optional. Null = every branch where the doctor had bookings that day.</summary>
    public Guid? BranchId { get; set; }
}