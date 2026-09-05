using MediatR;

namespace LokynexHealth.Application.ReportTemplates.Commands.DeleteReportTemplate;

public class DeleteReportTemplateCommand : IRequest
{
    public Guid Id { get; set; }
    public Guid? DeletedBy { get; set; }
}