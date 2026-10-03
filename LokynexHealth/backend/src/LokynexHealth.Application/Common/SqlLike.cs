namespace LokynexHealth.Application.Common;

public static class SqlLike
{
    /// <summary>Escapes % _ and \ so user text is matched literally by LIKE / ILIKE
    /// (important for emails, which often contain '_').</summary>
    public static string Escape(string value) =>
        value.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
}