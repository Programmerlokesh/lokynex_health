using LokynexHealth.Application.ReportDocuments.Queries.GetOrdersForReport;
using MediatR;

namespace LokynexHealth.Application.ReportDocuments.Queries.GetOrderForReport;

public class GetOrderForReportQuery : IRequest<OrderForReportDto>
{
    public Guid OrderId { get; set; }
}