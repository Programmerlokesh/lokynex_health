using System.Globalization;
using System.Text.RegularExpressions;
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

    // ---- text results (Reactive / Detected / Widal titre ...) ----
    // Mirrored in the UI: frontend/src/lib/blood-report/flags.ts (computeTextFlag).
    private static readonly Regex TitreValue = new(@"^1\s*[:/]\s*(\d+)$", RegexOptions.Compiled);
    private static readonly Regex TitreLimit = new(@"^<\s*1\s*:\s*(\d+)", RegexOptions.Compiled);
    private static readonly Regex NegativeRef = new(
        @"^(non[\s-]*reactive|not[\s-]*detected|negative|absent|nil)\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex NegativeValue = new(
        @"^(non[\s-]*reactive|not[\s-]*detected|not[\s-]*seen|negative|neg|nil|absent|normal|no)\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex PositiveValue = new(
        @"(reactive|positive|detected|present|seen|\bpos\b|\+)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    /// <summary>
    /// Auto flag for NON-numeric results. Returns "Abnormal" only when the result is clearly
    /// outside the reference text (e.g. reference "Non-Reactive" but result "Reactive", or
    /// Widal reference "&lt; 1:80" and result "1:160"). Anything unclear stays "Normal".
    /// </summary>
    public static string ComputeTextFlag(string? value, string? referenceText)
    {
        var v = value?.Trim();
        var r = referenceText?.Trim();
        if (string.IsNullOrEmpty(v) || string.IsNullOrEmpty(r)) return "Normal";

        // Titre style: reference "< 1:80", result "1:160"
        var limit = TitreLimit.Match(r);
        if (limit.Success)
        {
            var t = TitreValue.Match(v);
            if (t.Success
                && int.TryParse(t.Groups[1].Value, out var n)
                && int.TryParse(limit.Groups[1].Value, out var lim))
                return n >= lim ? "Abnormal" : "Normal";
            return "Normal";
        }

        // Qualitative style: reference "Non-Reactive" / "Not Detected" / "Negative"
        if (!NegativeRef.IsMatch(r)) return "Normal";
        if (NegativeValue.IsMatch(v)) return "Normal";
        return PositiveValue.IsMatch(v) ? "Abnormal" : "Normal";
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