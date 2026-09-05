namespace LokynexHealth.Application.CommissionOverrides.Queries.GetCommissionOverrides;

public class CommissionOverrideDto
{
    public Guid Id { get; set; }
    public string EntityType { get; set; } = default!;
    public Guid EntityId { get; set; }
    public Guid TestId { get; set; }
    public string TestName { get; set; } = default!;
    public string CommissionType { get; set; } = default!;
    public decimal CommissionValue { get; set; }
}