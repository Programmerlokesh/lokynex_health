using MediatR;

namespace LokynexHealth.Application.Ledger.Commands.SyncLedgerFromOrders;

public class SyncLedgerFromOrdersCommand : IRequest<int>
{
    public DateOnly DateFrom { get; set; }
    public DateOnly DateTo { get; set; }
}