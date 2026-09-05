using MediatR;

namespace LokynexHealth.Application.CommissionPayouts.Commands.MarkPayoutsPaid;

public class MarkPayoutsPaidCommand : IRequest<int>
{
    public List<Guid> PayoutIds { get; set; } = new();
    public Guid? PaidBy { get; set; }
}