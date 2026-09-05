using MediatR;

namespace LokynexHealth.Application.ReportDocuments.Commands.GenerateReportDocument;

public class GenerateReportDocumentCommand : IRequest<Guid>
{
    public Guid OrderItemId { get; set; }
    public Guid TemplateId { get; set; }
    public Guid? CreatedBy { get; set; }
}