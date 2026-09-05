using FluentValidation;

namespace LokynexHealth.Application.ReportDocuments.Commands.GenerateReportDocument;

public class GenerateReportDocumentCommandValidator : AbstractValidator<GenerateReportDocumentCommand>
{
    public GenerateReportDocumentCommandValidator()
    {
        RuleFor(x => x.OrderItemId).NotEmpty();
        RuleFor(x => x.TemplateId).NotEmpty();
    }
}