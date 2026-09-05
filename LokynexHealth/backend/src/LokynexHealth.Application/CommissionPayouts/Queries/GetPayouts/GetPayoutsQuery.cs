using MediatR;

namespace LokynexHealth.Application.CommissionPayouts.Queries.GetPayouts;

public class GetPayoutsQuery : IRequest<GetPayoutsResult>
{
    public DateOnly? DateFrom { get; set; }
    public DateOnly? DateTo { get; set; }
    public string? EntityType { get; set; }
    public Guid? EntityId { get; set; }
    public string? Status { get; set; }       // "Paid" | "Unpaid" | "All"
    public string GroupBy { get; set; } = "Day";   // "Day" | "Week" | "Month"
}

public class GetPayoutsResult
{
    public List<PayoutDto> Items { get; set; } = new();
    public List<PayoutSummaryDto> Summary { get; set; } = new();
    public decimal GrandTotal { get; set; }
}