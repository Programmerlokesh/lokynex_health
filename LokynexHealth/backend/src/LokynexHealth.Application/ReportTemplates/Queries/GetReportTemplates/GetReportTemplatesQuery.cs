using LokynexHealth.Application.Common.Models;
using MediatR;

namespace LokynexHealth.Application.ReportTemplates.Queries.GetReportTemplates;

public class GetReportTemplatesQuery : IRequest<PagedResult<ReportTemplateDto>>
{
    public bool ShowDeleted { get; set; } = false;
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}