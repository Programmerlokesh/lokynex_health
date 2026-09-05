using MediatR;

namespace LokynexHealth.Application.ReportDocuments.Commands.UpdateReportDocument;

public class UpdateReportDocumentCommand : IRequest
{
    public Guid Id { get; set; }
    public string? HeaderContent { get; set; }
    public string? FooterContent { get; set; }
    public string? BodyContent { get; set; }
    public Guid? UpdatedBy { get; set; }
}