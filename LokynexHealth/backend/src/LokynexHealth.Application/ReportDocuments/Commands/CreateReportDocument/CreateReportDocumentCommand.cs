using MediatR;

namespace LokynexHealth.Application.ReportDocuments.Commands.CreateReportDocument;

/// <summary>A report written from scratch in the editor, or imported from a DOCX.</summary>
public class CreateReportDocumentCommand : IRequest<Guid>
{
    public Guid OrderItemId { get; set; }
    public string? HeaderContent { get; set; }
    public string? FooterContent { get; set; }
    public string? BodyContent { get; set; }
    public string SourceType { get; set; } = "Manual";
    public Guid? CreatedBy { get; set; }
}