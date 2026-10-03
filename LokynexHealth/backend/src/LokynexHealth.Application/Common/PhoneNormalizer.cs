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

    /// <summary>
    /// Indian mobile number -> exactly 10 digits, or null when it isn't one.
    /// Accepts spaces/dashes/brackets and these prefixes, which are stripped:
    ///   +91 / 91 (12 digits), 0 (11 digits), 0091 (14 digits).
    /// The 10 digits must start with 6, 7, 8 or 9 (all Indian mobile series).
    /// e.g. "+91 98300-12345", "098300 12345", "9830012345" -> "9830012345".
    /// </summary>
    public static string? ToIndianMobile(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;

        var d = new string(raw.Where(char.IsDigit).ToArray());

        if (d.Length == 14 && d.StartsWith("0091")) d = d[4..];
        else if (d.Length == 12 && d.StartsWith("91")) d = d[2..];
        else if (d.Length == 11 && d.StartsWith('0')) d = d[1..];

        return d.Length == 10 && d[0] is >= '6' and <= '9' ? d : null;
    }

    /// <summary>
    /// Duplicate-detection key: digits only, last 10 digits. Used so that OLD
    /// records saved in any format ("+91 98300-12345") still match a new 10-digit one.
    /// </summary>
    public static string MatchKey(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        var digits = new string(raw.Where(char.IsDigit).ToArray());
        return digits.Length > 10 ? digits[^10..] : digits;
    }

    /// <summary>
    /// SQL LIKE pattern that matches any stored phone containing the last 6 digits
    /// of the number IN ORDER, ignoring spaces/dashes/brackets in the stored value
    /// (e.g. "%0%1%2%3%4%5%"). It is a cheap superset pre-filter; callers must
    /// confirm real matches with <see cref="MatchKey"/>. Null when fewer than 6 digits.
    /// </summary>
    public static string? FormatInsensitiveLikePattern(string? raw)
    {
        var key = MatchKey(raw);
        if (key.Length < 6) return null;
        var tail = key[^6..];
        return "%" + string.Join("%", tail.Select(c => c.ToString())) + "%";
    }
}