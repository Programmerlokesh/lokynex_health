using FluentValidation;

namespace LokynexHealth.Application.ReportTemplates.Commands.CreateReportTemplate;

public class CreateReportTemplateCommandValidator : AbstractValidator<CreateReportTemplateCommand>
{
    public CreateReportTemplateCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.SourceType).Must(t => t is "Manual" or "UploadedDocument");
    }
}