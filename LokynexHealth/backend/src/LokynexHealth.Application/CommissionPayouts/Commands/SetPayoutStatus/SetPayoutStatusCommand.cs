using MediatR;

namespace LokynexHealth.Application.CommissionPayouts.Commands.SetPayoutStatus;

/// <summary>Marks payouts Paid OR back to Unpaid. Returns how many rows really changed.</summary>
public class SetPayoutStatusCommand : IRequest<int>
{
    public List<Guid> PayoutIds { get; set; } = new();
    public string Status { get; set; } = "Paid";   // Paid | Unpaid
}