using FluentValidation;

namespace LokynexHealth.Application.ReportDocuments.Commands.CreateReportDocument;

public class CreateReportDocumentCommandValidator : AbstractValidator<CreateReportDocumentCommand>
{
    public CreateReportDocumentCommandValidator()
    {
        RuleFor(x => x.OrderItemId).NotEmpty();
        RuleFor(x => x.SourceType).Must(t => t is "Manual" or "UploadedDocument");
        RuleFor(x => x.HeaderContent).MaximumLength(2_000_000);
        RuleFor(x => x.BodyContent).MaximumLength(5_000_000);
        RuleFor(x => x.FooterContent).MaximumLength(2_000_000);
    }
}