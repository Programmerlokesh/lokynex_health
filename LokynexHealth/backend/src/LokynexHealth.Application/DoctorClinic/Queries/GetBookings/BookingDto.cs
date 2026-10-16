namespace LokynexHealth.Application.DoctorClinic.Queries.GetBookings;

public class BookingDto
{
    public Guid Id { get; set; }
    public Guid DoctorId { get; set; }
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = default!;
    public DateOnly BookingDate { get; set; }
    public TimeOnly TimeSlot { get; set; }
    public int? SerialNo { get; set; }
    public string PatientName { get; set; } = default!;
    public string PatientPhone { get; set; } = default!;
    public string? Reason { get; set; }
    public decimal VisitFee { get; set; }
    public string? PaymentMethod { get; set; }
    public string Status { get; set; } = default!;
}