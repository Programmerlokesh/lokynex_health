namespace LokynexHealth.Application.CommissionPayouts.Queries.GetCommissionReport;

public class CommissionReportRowDto
{
    public Guid PayoutId { get; set; }
    public Guid OrderId { get; set; }
    public string OrderNumber { get; set; } = default!;
    public DateTimeOffset OrderDate { get; set; }
    public string PatientName { get; set; } = default!;
    public string PatientPhone { get; set; } = default!;
    public string TestName { get; set; } = default!;

    public decimal TestAmount { get; set; }
    public decimal Less { get; set; }
    public decimal Paid { get; set; }
    public decimal Due { get; set; }

    public string? DoctorName { get; set; }
    public string? ReferralName { get; set; }

    public Guid EntityId { get; set; }
    public string EntityName { get; set; } = default!;
    public decimal CommissionAmount { get; set; }
    public string Status { get; set; } = default!;
    public DateTimeOffset? PaidAt { get; set; }
}

public class CommissionReportSummaryDto
{
    public int OrderCount { get; set; }
    public int TestCount { get; set; }
    public decimal LineTotal { get; set; }
    public decimal TotalLess { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal TotalDue { get; set; }
    public decimal Commission { get; set; }
    public decimal PaidCommission { get; set; }
    public decimal UnpaidCommission { get; set; }
}

public class CommissionReportResult
{
    public List<CommissionReportRowDto> Rows { get; set; } = new();
    public CommissionReportSummaryDto Summary { get; set; } = new();
    public bool Truncated { get; set; }
    public int MaxRows { get; set; }
}