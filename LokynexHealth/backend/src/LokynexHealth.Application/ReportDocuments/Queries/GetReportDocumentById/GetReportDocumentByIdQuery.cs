using LokynexHealth.Application.ReportDocuments.Queries.GetReportDocuments;
using MediatR;

namespace LokynexHealth.Application.ReportDocuments.Queries.GetReportDocumentById;

public class GetReportDocumentByIdQuery : IRequest<ReportDocumentDto>
{
    public Guid Id { get; set; }
}