namespace LokynexHealth.Application.Common;

public static class PhoneNormalizer
{
    /// <summary>Keeps digits and a leading '+', so "98300-12345" and "98300 12345"
    /// resolve to the same patient.</summary>
    public static string Normalize(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        var trimmed = raw.Trim();
        var sb = new System.Text.StringBuilder(trimmed.Length);
        foreach (var ch in trimmed)
        {
            if (char.IsDigit(ch) || (ch == '+' && sb.Length == 0))
                sb.Append(ch);
        }
        return sb.ToString();
    }
}