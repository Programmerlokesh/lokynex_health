using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

public class DoctorClinicBooking
{
    public Guid Id { get; set; }
    public Guid? ScheduleId { get; set; }
    public Guid DoctorId { get; set; }
    public Guid BranchId { get; set; }
    public DateOnly BookingDate { get; set; }
    public TimeOnly TimeSlot { get; set; }
    public string PatientName { get; set; } = default!;
    public string PatientPhone { get; set; } = default!;
    public string? PatientEmail { get; set; }
    public string? Note { get; set; }
    public BookingStatusType Status { get; set; } = BookingStatusType.Booked;
    public DateTimeOffset CreatedAt { get; set; }
}