using MediatR;

namespace LokynexHealth.Application.CommissionPayouts.Commands.GeneratePayouts;

public class GeneratePayoutsCommand : IRequest<int>   // returns count of payout rows created
{
    public DateOnly DateFrom { get; set; }
    public DateOnly DateTo { get; set; }
    public Guid? BranchId { get; set; }
    public Guid? GeneratedBy { get; set; }
}