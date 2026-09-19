namespace LokynexHealth.Application.CommissionPayouts.Queries.GetPayouts;

public class PayoutDto
{
    public Guid Id { get; set; }
    public string EntityType { get; set; } = default!;
    public Guid EntityId { get; set; }
    public string EntityName { get; set; } = default!;
    public Guid OrderItemId { get; set; }
    public decimal CommissionAmount { get; set; }
    public string Status { get; set; } = default!;
    public DateTimeOffset GeneratedAt { get; set; }
    public DateTimeOffset? PaidAt { get; set; }
}