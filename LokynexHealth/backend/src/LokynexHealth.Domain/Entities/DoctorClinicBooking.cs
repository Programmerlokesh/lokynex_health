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

    /// <summary>1, 2, 3 ... per (doctor, branch, date). Never reused, even if a booking is cancelled.</summary>
    public int? SerialNo { get; set; }

    public string PatientName { get; set; } = default!;
    public string PatientPhone { get; set; } = default!;
    public string? PatientEmail { get; set; }

    /// <summary>Reason for visit (stored in the existing "note" column).</summary>
    public string? Note { get; set; }

    /// <summary>Visit fee collected at booking time. 0 = nothing collected.</summary>
    public decimal VisitFee { get; set; }

    /// <summary>How the visit fee was paid. Null when VisitFee is 0.</summary>
    public PaymentMethodType? PaymentMethod { get; set; }

    public BookingStatusType Status { get; set; } = BookingStatusType.Booked;
    public DateTimeOffset CreatedAt { get; set; }
}