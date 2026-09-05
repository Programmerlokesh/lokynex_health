using MediatR;

namespace LokynexHealth.Application.Ledger.Queries.GetLedgerSummary;

public class GetLedgerSummaryQuery : IRequest<LedgerSummaryResult>
{
    public Guid? BranchId { get; set; }
    public DateOnly? DateFrom { get; set; }
    public DateOnly? DateTo { get; set; }
}