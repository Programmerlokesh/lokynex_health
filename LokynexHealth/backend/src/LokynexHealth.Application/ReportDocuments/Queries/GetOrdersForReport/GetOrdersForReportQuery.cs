using LokynexHealth.Application.Common.Models;
using MediatR;

namespace LokynexHealth.Application.ReportDocuments.Queries.GetOrdersForReport;

public class GetOrdersForReportQuery : IRequest<PagedResult<OrderForReportDto>>
{
    public string? Search { get; set; }
    /// <summary>Only orders that still have at least one test without a report.</summary>
    public bool OnlyPending { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 18;
}