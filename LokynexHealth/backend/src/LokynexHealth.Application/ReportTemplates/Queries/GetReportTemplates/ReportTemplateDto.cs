namespace LokynexHealth.Application.ReportTemplates.Queries.GetReportTemplates;

public class ReportTemplateDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string SourceType { get; set; } = default!;
    public bool IsDeleted { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}