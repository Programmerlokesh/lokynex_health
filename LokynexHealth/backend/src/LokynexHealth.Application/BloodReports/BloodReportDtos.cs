namespace LokynexHealth.Application.BloodReports;

public class BloodReportParameterDto
{
    public Guid ParameterId { get; set; }
    public string SectionName { get; set; } = string.Empty;
    public string Name { get; set; } = default!;
    public string? Unit { get; set; }
    public string? ReferenceText { get; set; }
    public decimal? Low { get; set; }
    public decimal? High { get; set; }
    public decimal? CriticalLow { get; set; }
    public decimal? CriticalHigh { get; set; }
    public string ResultType { get; set; } = "Auto";
    public short? DecimalPlaces { get; set; }
    public bool IsBold { get; set; }
    public int SortOrder { get; set; }
    public string? ResultValue { get; set; }
    public string Flag { get; set; } = "Normal";
}

public class LabReportSettingDto
{
    public bool UseLetterhead { get; set; } = true;
    public string? HeaderHtml { get; set; }
    public string? FooterHtml { get; set; }
    public int HeaderSpaceMm { get; set; } = 40;
    public int FooterSpaceMm { get; set; } = 30;
    public string? PathologistName { get; set; }
    public string? PathologistQualification { get; set; }
    public string? RegistrationNo { get; set; }
    public string? SignatureImage { get; set; }
}

public class BloodReportFormDto
{
    public Guid OrderId { get; set; }
    public Guid OrderItemId { get; set; }
    public string OrderNumber { get; set; } = default!;
    public DateTimeOffset OrderCreatedAt { get; set; }
    public string TestName { get; set; } = default!;
    public string DepartmentName { get; set; } = string.Empty;

    public string PatientName { get; set; } = default!;
    public string? PatientCode { get; set; }
    public string PatientPhone { get; set; } = default!;
    public string? WhatsappNumber { get; set; }
    public int? PatientAge { get; set; }
    public string? PatientGender { get; set; }
    public string? DoctorName { get; set; }
    public string? ReferralName { get; set; }
    public string? BranchName { get; set; }
    public string? BranchAddress { get; set; }
    public string? BranchPhone { get; set; }

    public Guid? ReportDocumentId { get; set; }
    public bool HasFormat { get; set; }

    public string? SampleId { get; set; }
    public string? Specimen { get; set; }
    public string? Method { get; set; }
    public string? MachineName { get; set; }
    public string? ReagentName { get; set; }
    public string? Remarks { get; set; }
    public DateTimeOffset? SampleCollectedAt { get; set; }
    public DateTimeOffset? ReportedAt { get; set; }

    public List<BloodReportParameterDto> Parameters { get; set; } = new();
    public LabReportSettingDto Settings { get; set; } = new();
}