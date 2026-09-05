using MediatR;

namespace LokynexHealth.Application.CommissionOverrides.Commands.SetCommissionOverride;

public class SetCommissionOverrideCommand : IRequest<Guid>
{
    public string EntityType { get; set; } = default!;   // "Doctor" | "Referral" | "Technician"
    public Guid EntityId { get; set; }                    // the doctor/referral/technician's own id
    public Guid TestId { get; set; }
    public string CommissionType { get; set; } = default!;
    public decimal CommissionValue { get; set; }
}