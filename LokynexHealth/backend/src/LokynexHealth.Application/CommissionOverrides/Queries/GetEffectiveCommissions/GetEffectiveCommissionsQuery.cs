using MediatR;

namespace LokynexHealth.Application.CommissionOverrides.Queries.GetEffectiveCommissions;

/// <summary>For one person + one department: every test with the commission that person gets today.</summary>
public class GetEffectiveCommissionsQuery : IRequest<List<EffectiveCommissionDto>>
{
    public string EntityType { get; set; } = default!;   // Doctor | Referral | Technician
    public Guid EntityId { get; set; }
    public Guid DepartmentId { get; set; }
}

public class EffectiveCommissionDto
{
    public Guid TestId { get; set; }
    public string TestName { get; set; } = default!;
    public decimal Price { get; set; }
    public string TestStatus { get; set; } = default!;

    /// <summary>The test's own (default) commission for this kind of person.</summary>
    public string DefaultCommissionType { get; set; } = default!;
    public decimal DefaultCommissionValue { get; set; }

    /// <summary>True when a person-specific commission exists.</summary>
    public bool HasOverride { get; set; }
    public string CommissionType { get; set; } = default!;      // effective
    public decimal CommissionValue { get; set; }                // effective
}