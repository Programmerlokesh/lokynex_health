namespace LokynexHealth.Application.ReportDocuments.Queries.GetOrderItemsForReport;

public class OrderItemLookupDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = default!;
    public string TestName { get; set; } = default!;
    public string PatientName { get; set; } = default!;
    public string PatientPhone { get; set; } = default!;
}