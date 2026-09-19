using MediatR;

namespace LokynexHealth.Application.ReportDocuments.Queries.GetOrderItemsForReport;

public class GetOrderItemsForReportQuery : IRequest<List<OrderItemLookupDto>>
{
    public string? Search { get; set; }
}