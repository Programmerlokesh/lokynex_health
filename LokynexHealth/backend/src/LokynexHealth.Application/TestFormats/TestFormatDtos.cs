namespace LokynexHealth.Application.TestFormats;

public class TestFormatListItemDto
{
    public Guid TestId { get; set; }
    public string TestName { get; set; } = default!;
    public string DepartmentName { get; set; } = string.Empty;
    public int ParameterCount { get; set; }
}

public class TestFormatRangeDto
{
    /// <summary>null = everyone, otherwise Male / Female / Other.</summary>
    public string? Gender { get; set; }
    public int? AgeMinDays { get; set; }
    public int? AgeMaxDays { get; set; }
    public decimal? LowValue { get; set; }
    public decimal? HighValue { get; set; }
    public decimal? CriticalLow { get; set; }
    public decimal? CriticalHigh { get; set; }
    public string? NormalText { get; set; }
    public string? DisplayText { get; set; }
}

public class TestFormatParameterDto
{
    public Guid? Id { get; set; }
    public string SectionName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Unit { get; set; }
    public string ResultType { get; set; } = "Auto";
    public bool IsBold { get; set; }
    public List<TestFormatRangeDto> Ranges { get; set; } = new();
}

public class TestFormatDto
{
    public Guid TestId { get; set; }
    public string TestName { get; set; } = default!;
    public string DepartmentName { get; set; } = string.Empty;
    public string? Specimen { get; set; }
    public string? Method { get; set; }
    public string? MachineName { get; set; }
    public string? ReagentName { get; set; }
    public string? Interpretation { get; set; }
    public List<TestFormatParameterDto> Parameters { get; set; } = new();
}