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

    // ---- structured blood report (014 / 015 SQL) ----
    public bool? UseLetterhead { get; set; }
    public DateTimeOffset? SampleCollectedAt { get; set; }
    public DateTimeOffset? ReportedAt { get; set; }
    public Guid? VerifiedBy { get; set; }
    public DateTimeOffset? PdfGeneratedAt { get; set; }
    public string? Specimen { get; set; }
    public string? MethodText { get; set; }
    public string? MachineName { get; set; }
    public string? ReagentName { get; set; }
    public string? SampleId { get; set; }
    public string? ReportRemarks { get; set; }

    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }
}