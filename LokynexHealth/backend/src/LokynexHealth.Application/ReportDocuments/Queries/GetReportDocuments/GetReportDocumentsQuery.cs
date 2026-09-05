using LokynexHealth.Application.Common.Models;
using MediatR;

namespace LokynexHealth.Application.ReportDocuments.Queries.GetReportDocuments;

public class GetReportDocumentsQuery : IRequest<PagedResult<ReportDocumentDto>>
{
    public Guid? OrderItemId { get; set; }
    public bool ShowDeleted { get; set; } = false;
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}