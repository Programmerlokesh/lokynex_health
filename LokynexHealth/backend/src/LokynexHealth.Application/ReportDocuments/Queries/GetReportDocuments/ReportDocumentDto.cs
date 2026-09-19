namespace LokynexHealth.Application.ReportDocuments.Queries.GetReportDocuments;

public class ReportDocumentDto
{
    public Guid Id { get; set; }
    public Guid OrderItemId { get; set; }
    public string OrderNumber { get; set; } = default!;
    public string TestName { get; set; } = default!;
    public string PatientName { get; set; } = default!;
    public string? HeaderContent { get; set; }
    public string? FooterContent { get; set; }
    public string? BodyContent { get; set; }
    public bool IsDeleted { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}