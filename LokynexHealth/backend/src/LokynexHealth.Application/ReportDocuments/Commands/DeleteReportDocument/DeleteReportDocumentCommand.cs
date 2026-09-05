using MediatR;

namespace LokynexHealth.Application.ReportDocuments.Commands.DeleteReportDocument;

public class DeleteReportDocumentCommand : IRequest
{
    public Guid Id { get; set; }
    public Guid? DeletedBy { get; set; }
}