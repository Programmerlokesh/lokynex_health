using System.Globalization;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Application.BloodReports;

public static class BloodReportConstants
{
    /// <summary>Written at the start of body_content so the UI knows a report is structured.</summary>
    public const string StructuredMarker = "<!--lokynex:structured-->";
}

public static class BloodReportRules
{
    /// <summary>Same selection logic as get_reference_range() in 014 SQL.</summary>
    public static TestReferenceRange? PickRange(
        IEnumerable<TestReferenceRange> ranges, GenderType? gender, int? ageDays)
    {
        return ranges
            .Where(r =>
                (r.Gender == null || (gender != null && r.Gender == gender)) &&
                (r.AgeMinDays == null || ageDays == null || ageDays >= r.AgeMinDays) &&
                (r.AgeMaxDays == null || ageDays == null || ageDays <= r.AgeMaxDays))
            .OrderByDescending(r => r.Gender != null)
            .ThenByDescending(r => r.AgeMinDays != null)
            .FirstOrDefault();
    }

    /// <summary>Text for the "Reference Range" column. Gender unknown -> show all.</summary>
    public static string? ReferenceText(IEnumerable<TestReferenceRange> all, TestReferenceRange? picked)
    {
        if (picked is not null) return picked.DisplayText;
        var list = all.ToList();
        if (list.Count == 0) return null;
        return string.Join(" | ", list.Select(r =>
            (r.Gender == GenderType.Male ? "M: " : r.Gender == GenderType.Female ? "F: " : "") + r.DisplayText));
    }

    public static decimal? ParseNumber(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var s = raw.Trim().Replace(",", "");
        if (s.StartsWith('<') || s.StartsWith('>')) return null;
        return decimal.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out var v) ? v : null;
    }

    public static string ComputeFlag(decimal? value, decimal? low, decimal? high, decimal? critLow, decimal? critHigh)
    {
        if (value is null) return "Normal";
        if (critLow is not null && value < critLow) return "Critical";
        if (critHigh is not null && value > critHigh) return "Critical";
        if (low is not null && value < low) return "Low";
        if (high is not null && value > high) return "High";
        return "Normal";
    }
}