namespace LokynexHealth.Application.Owners;

/// <summary>One panel + access level, e.g. { Panel = "plans", Level = "view" }.</summary>
public class StaffPermissionDto
{
    public string Panel { get; set; } = default!;
    /// <summary>"view" or "manage".</summary>
    public string Level { get; set; } = default!;
}

/// <summary>The console panels a SuperAdmin can open up to a staff member.
/// Stored in platform.owners.permissions as "labs:manage,plans:view".</summary>
public static class StaffPanels
{
    public const string Labs = "labs";
    public const string Plans = "plans";
    public const string Subscriptions = "subscriptions";
    public const string Notifications = "notifications";
    public const string Ledger = "ledger";

    public const string View = "view";
    public const string Manage = "manage";

    public static readonly string[] All = { Labs, Plans, Subscriptions, Notifications, Ledger };

    public static bool IsValid(StaffPermissionDto? p) =>
        p is not null
        && All.Contains(p.Panel)
        && (p.Level == View || p.Level == Manage);

    /// <summary>Drops unknown/duplicate entries (Manage wins over View) and builds the stored string.</summary>
    public static string Serialize(IEnumerable<StaffPermissionDto>? items)
    {
        if (items is null) return "";
        var best = new Dictionary<string, string>();
        foreach (var p in items)
        {
            if (!IsValid(p)) continue;
            if (!best.TryGetValue(p.Panel, out var current) || (p.Level == Manage && current != Manage))
                best[p.Panel] = p.Level;
        }
        return string.Join(",", All.Where(best.ContainsKey).Select(k => $"{k}:{best[k]}"));
    }

    public static Dictionary<string, string> Parse(string? raw)
    {
        var map = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(raw)) return map;

        foreach (var part in raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            var i = part.IndexOf(':');
            if (i <= 0) continue;
            var panel = part[..i];
            var level = part[(i + 1)..];
            if (All.Contains(panel) && (level == View || level == Manage))
                map[panel] = level;
        }
        return map;
    }

    public static List<StaffPermissionDto> ToDto(string? raw) =>
        Parse(raw).Select(kv => new StaffPermissionDto { Panel = kv.Key, Level = kv.Value }).ToList();

    /// <summary>panelsAnyOf is "labs" or "labs|subscriptions" (any one is enough).
    /// write = true needs the Manage level.</summary>
    public static bool Allows(string? raw, string panelsAnyOf, bool write)
    {
        var map = Parse(raw);
        foreach (var panel in panelsAnyOf.Split('|', StringSplitOptions.RemoveEmptyEntries))
        {
            if (map.TryGetValue(panel, out var level) && (!write || level == Manage))
                return true;
        }
        return false;
    }
}