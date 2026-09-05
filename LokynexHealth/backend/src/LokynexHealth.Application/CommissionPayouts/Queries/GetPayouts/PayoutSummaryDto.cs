namespace LokynexHealth.Application.CommissionPayouts.Queries.GetPayouts;

public class PayoutSummaryDto
{
    public string PeriodLabel { get; set; } = default!;   // e.g. "2026-08-15" or "2026-W33" or "2026-08"
    public int Count { get; set; }
    public decimal TotalAmount { get; set; }
}