using MediatR;

namespace LokynexHealth.Application.DoctorClinic.Commands.BookAppointment;

public class BookAppointmentCommand : IRequest<BookAppointmentResult>
{
    public Guid DoctorId { get; set; }
    public Guid BranchId { get; set; }
    public DateOnly BookingDate { get; set; }
    public TimeOnly TimeSlot { get; set; }
    public string PatientName { get; set; } = default!;
    public string PatientPhone { get; set; } = default!;
    public string? PatientEmail { get; set; }

    /// <summary>Reason for visit.</summary>
    public string? Note { get; set; }

    /// <summary>Visit fee collected now. 0 = nothing collected.</summary>
    public decimal VisitFee { get; set; }

    /// <summary>"Cash", "Card" or "UPI". Required when VisitFee &gt; 0.</summary>
    public string? PaymentMethod { get; set; }
}

public class BookAppointmentResult
{
    public Guid Id { get; set; }
    public int SerialNo { get; set; }
}