namespace LokynexHealth.Application.ReportDocuments.Queries.GetOrdersForReport;

public class OrderForReportDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = default!;
    public string PatientName { get; set; } = default!;
    public string PatientPhone { get; set; } = default!;
    public int? PatientAge { get; set; }
    public string? PatientGender { get; set; }
    public string? PatientAddress { get; set; }
    public string? DoctorName { get; set; }
    public string? ReferralName { get; set; }
    public string? BranchName { get; set; }
    public string? BranchAddress { get; set; }
    public string? BranchPhone { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public List<OrderForReportItemDto> Items { get; set; } = new();
}

public class OrderForReportItemDto
{
    public Guid Id { get; set; }
    public string TestName { get; set; } = default!;
    public string DepartmentName { get; set; } = string.Empty;
    /// <summary>How many non-deleted reports exist for this test line.</summary>
    public int ReportCount { get; set; }
}