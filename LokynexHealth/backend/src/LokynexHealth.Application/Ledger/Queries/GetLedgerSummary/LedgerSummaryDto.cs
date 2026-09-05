namespace LokynexHealth.Application.Ledger.Queries.GetLedgerSummary;

public class LedgerSummaryDto
{
    public string EntryType { get; set; } = default!;
    public decimal TotalAmount { get; set; }
    public int EntryCount { get; set; }
}

public class LedgerSummaryResult
{
    public List<LedgerSummaryDto> ByType { get; set; } = new();
    public decimal NetProfitLoss { get; set; }
}