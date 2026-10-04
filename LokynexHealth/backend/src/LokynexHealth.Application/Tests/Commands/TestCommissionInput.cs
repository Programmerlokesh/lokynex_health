namespace LokynexHealth.Application.Tests.Commands;

/// <summary>
/// A commission that applies to ONE specific doctor / referral / technician
/// for ONE test (stored as a commission_overrides row).
/// </summary>
public class TestCommissionInput
{
    public string EntityType { get; set; } = default!;   // "Doctor" | "Referral" | "Technician"
    public Guid EntityId { get; set; }
    public string CommissionType { get; set; } = "Flat";  // "Flat" | "Percentage"
    public decimal CommissionValue { get; set; }
}