using MediatR;

namespace LokynexHealth.Application.ReportTemplates.Commands.CreateReportTemplate;

public class CreateReportTemplateCommand : IRequest<Guid>
{
    public string Name { get; set; } = default!;
    public Guid? DepartmentId { get; set; }
    public string? HeaderContent { get; set; }
    public string? FooterContent { get; set; }
    public string? BodyContent { get; set; }
    public string SourceType { get; set; } = "Manual";
    public string? OriginalFilePath { get; set; }
    public Guid? CreatedBy { get; set; }
}