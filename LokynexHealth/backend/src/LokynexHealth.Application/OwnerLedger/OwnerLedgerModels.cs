namespace LokynexHealth.Application.OwnerLedger;

public static class OwnerLedgerTypes
{
    public const string Income = "Income";
    public const string Expense = "Expense";
    public const string Refund = "Refund";
    public const string CommissionPayout = "CommissionPayout";

    public static readonly string[] All = { Income, Expense, Refund, CommissionPayout };
}

/// <summary>All outflow figures are POSITIVE magnitudes; Net is signed.</summary>
public class OwnerLedgerTotals
{
    public decimal Income { get; set; }
    public decimal Refund { get; set; }
    public decimal CommissionPayout { get; set; }
    public decimal Expense { get; set; }
    public decimal Net { get; set; }
    public int EntryCount { get; set; }
}

public class OwnerLedgerSeriesPoint
{
    public string Bucket { get; set; } = default!;   // yyyy-MM-dd (bucket start)
    public decimal Income { get; set; }
    public decimal Refund { get; set; }
    public decimal CommissionPayout { get; set; }
    public decimal Expense { get; set; }
    public decimal Net { get; set; }
    public decimal CumulativeNet { get; set; }
}

public class OwnerLedgerLabRow
{
    public Guid? TenantId { get; set; }
    public string LabName { get; set; } = default!;
    public string? LabCode { get; set; }
    public decimal Income { get; set; }
    public decimal Outflow { get; set; }
    public decimal Net { get; set; }
    public int EntryCount { get; set; }
    public int SubscriptionCount { get; set; }
}

public class OwnerLedgerCategoryRow
{
    public string EntryType { get; set; } = default!;
    public string Category { get; set; } = default!;
    public decimal Total { get; set; }
    public decimal PreviousTotal { get; set; }
    public int EntryCount { get; set; }
}

public class OwnerLedgerLabOption
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string Code { get; set; } = default!;
}

public class OwnerLedgerAnalyticsResult
{
    public DateOnly DateFrom { get; set; }
    public DateOnly DateTo { get; set; }
    public DateOnly PreviousFrom { get; set; }
    public DateOnly PreviousTo { get; set; }
    public string Granularity { get; set; } = "day";
    public OwnerLedgerTotals Current { get; set; } = new();
    public OwnerLedgerTotals Previous { get; set; } = new();
    public List<OwnerLedgerSeriesPoint> Series { get; set; } = new();
    public List<OwnerLedgerLabRow> Labs { get; set; } = new();
    public List<OwnerLedgerCategoryRow> Categories { get; set; } = new();
    public List<OwnerLedgerLabOption> LabOptions { get; set; } = new();
    public decimal SubscriptionRevenue { get; set; }
    public int SubscriptionCount { get; set; }
    public int LabsAddedInPeriod { get; set; }
    public int TotalLabs { get; set; }
}

public class OwnerLedgerEntryDto
{
    public Guid Id { get; set; }
    public DateOnly EntryDate { get; set; }
    public string EntryType { get; set; } = default!;
    public string? Category { get; set; }
    public decimal Amount { get; set; }
    public Guid? TenantId { get; set; }
    public string? LabName { get; set; }
    public string? LabCode { get; set; }
    public string? PaymentMethod { get; set; }
    public string? ReferenceNo { get; set; }
    public string? Description { get; set; }
    /// <summary>"Manual" (editable) or "Subscription" (automatic, read-only).</summary>
    public string Source { get; set; } = "Manual";
    public DateTimeOffset CreatedAt { get; set; }
}