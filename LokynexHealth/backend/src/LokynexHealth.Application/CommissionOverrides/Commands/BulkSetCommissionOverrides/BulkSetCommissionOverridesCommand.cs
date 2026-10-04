using MediatR;

namespace LokynexHealth.Application.CommissionOverrides.Commands.BulkSetCommissionOverrides;

/// <summary>Commission Setup tab: update many tests of one department for one person at once.</summary>
public class BulkSetCommissionOverridesCommand : IRequest<int>
{
    public string EntityType { get; set; } = default!;
    public Guid EntityId { get; set; }
    public Guid DepartmentId { get; set; }
    public List<BulkCommissionItem> Items { get; set; } = new();
}

public class BulkCommissionItem
{
    public Guid TestId { get; set; }
    public string CommissionType { get; set; } = "Flat";
    public decimal CommissionValue { get; set; }

    /// <summary>true = delete the person-specific row (the test default applies again).</summary>
    public bool Reset { get; set; }
}