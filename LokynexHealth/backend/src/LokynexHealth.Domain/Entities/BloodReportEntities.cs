using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

public class TestParameter : BaseEntity
{
    public Guid TestId { get; set; }
    public string SectionName { get; set; } = string.Empty;
    public string Name { get; set; } = default!;
    public string? Unit { get; set; }
    public string? Method { get; set; }
    public string ResultType { get; set; } = "Auto";
    public short? DecimalPlaces { get; set; }
    public int SortOrder { get; set; }
    public bool IsBold { get; set; }
    public RecordStatus Status { get; set; } = RecordStatus.Active;

    public ICollection<TestReferenceRange> ReferenceRanges { get; set; } = new List<TestReferenceRange>();
}

public class TestReferenceRange
{
    public Guid Id { get; set; }
    public Guid ParameterId { get; set; }
    public GenderType? Gender { get; set; }
    public int? AgeMinDays { get; set; }
    public int? AgeMaxDays { get; set; }
    public decimal? LowValue { get; set; }
    public decimal? HighValue { get; set; }
    public decimal? CriticalLow { get; set; }
    public decimal? CriticalHigh { get; set; }
    public string? NormalText { get; set; }
    public string DisplayText { get; set; } = default!;
}

public class ReportResult : BaseEntity
{
    public Guid ReportDocumentId { get; set; }
    public Guid ParameterId { get; set; }

    public string SectionName { get; set; } = string.Empty;
    public string ParameterName { get; set; } = default!;
    public string? Unit { get; set; }
    public string? ReferenceText { get; set; }
    public int SortOrder { get; set; }

    public string? ResultValue { get; set; }
    public decimal? ResultNumeric { get; set; }
    public string Flag { get; set; } = "Normal";
    public string? Remarks { get; set; }
    public Guid? EnteredBy { get; set; }
}

public class LabReportSetting : BaseEntity
{
    public Guid? BranchId { get; set; }
    public bool UseLetterhead { get; set; } = true;
    public string? HeaderHtml { get; set; }
    public string? FooterHtml { get; set; }
    public short HeaderSpaceMm { get; set; } = 40;
    public short FooterSpaceMm { get; set; } = 30;
    public string? PathologistName { get; set; }
    public string? PathologistQualification { get; set; }
    public string? RegistrationNo { get; set; }
    public string? SignatureImage { get; set; }
    public Guid? UpdatedBy { get; set; }
}

public class ReportDelivery
{
    public Guid Id { get; set; }
    public Guid ReportDocumentId { get; set; }
    public string Channel { get; set; } = default!;
    public string? SentTo { get; set; }
    public string Status { get; set; } = "Done";
    public string? ErrorMessage { get; set; }
    public Guid? DeliveredBy { get; set; }
    public DateTimeOffset DeliveredAt { get; set; }
}

public class TestReportInfo
{
    public Guid TestId { get; set; }
    public string? Specimen { get; set; }
    public string? Method { get; set; }
    public string? MachineName { get; set; }
    public string? ReagentName { get; set; }
    public string? Interpretation { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}


/// <summary>
/// Pick-list entry for blood reports: a machine (analyser) or a reagent (chemical)
/// the lab uses. Kind = "Machine" | "Reagent".
/// </summary>
public class ReportOption : BaseEntity
{
    public string Kind { get; set; } = default!;
    public string Name { get; set; } = default!;
}