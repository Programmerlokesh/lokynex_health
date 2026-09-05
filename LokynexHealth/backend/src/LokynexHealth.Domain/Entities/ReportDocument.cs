using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

public class ReportDocument : BaseEntity
{
    public Guid OrderItemId { get; set; }
    public OrderItem OrderItem { get; set; } = default!;
    public Guid? TemplateId { get; set; }

    public string? HeaderContent { get; set; }
    public string? FooterContent { get; set; }
    public string? BodyContent { get; set; }

    public ReportSourceType SourceType { get; set; } = ReportSourceType.Manual;
    public string? OriginalFilePath { get; set; }
    public string? ExportedFilePath { get; set; }

    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }
}