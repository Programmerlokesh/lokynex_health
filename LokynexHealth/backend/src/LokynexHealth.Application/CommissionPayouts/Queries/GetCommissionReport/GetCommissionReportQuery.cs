using MediatR;

namespace LokynexHealth.Application.CommissionPayouts.Queries.GetCommissionReport;

public class GetCommissionReportQuery : IRequest<CommissionReportResult>
{
    public DateOnly? DateFrom { get; set; }
    public DateOnly? DateTo { get; set; }

    /// <summary>Minutes east of UTC of the user's browser (IST = 330).</summary>
    public int TzOffsetMinutes { get; set; } = 330;

    public string EntityType { get; set; } = "Referral";   // Doctor | Referral | Technician
    public Guid? EntityId { get; set; }
    public string? Status { get; set; }                    // All | Paid | Unpaid

    // Contact filters of the doctor / referral / technician (contains, case-insensitive)
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
}