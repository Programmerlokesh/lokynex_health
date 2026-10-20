using FluentValidation;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;

namespace LokynexHealth.Application.Clinics;

public static class ClinicTokens
{
    public const string Admin = "ClinicAdmin";
    public const string User = "ClinicUser";
}

/// <summary>Shared helpers: who is the caller, which clinic is theirs, IST "today".</summary>
public static class ClinicScope
{
    /// <summary>The clinic of the signed-in caller. Every clinic query filters by this id,
    /// which is what keeps one clinic's data invisible to every other clinic.</summary>
    public static Guid Id(ICurrentUserService user) =>
        user.ClinicId ?? throw new UnauthorizedException("Clinic access only.");

    public static string? Clean(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    /// <summary>India Standard Time (UTC+5:30, no daylight saving) — the date a clinic sees on its wall calendar.</summary>
    public static DateOnly Today() => DateOnly.FromDateTime(DateTime.UtcNow.AddMinutes(330));

    public static string Escape(string s) => Common.SqlLike.Escape(s.Trim());
}

/// <summary>Clinic modules, actions and role presets. Stored on a user as
/// "prescriptions:view,prescriptions:create". Parsed into a HashSet, so every check is O(1).</summary>
public static class ClinicPermissions
{
    public static readonly string[] Modules =
        { "appointments", "doctors", "patients", "prescriptions", "medicines", "ledger", "users" };

    public static readonly string[] Actions = { "view", "create", "edit", "delete" };

    public static readonly Dictionary<string, string> ModuleLabels = new()
    {
        ["appointments"] = "Appointments",
        ["doctors"] = "Doctors & Schedules",
        ["patients"] = "Patients",
        ["prescriptions"] = "Prescriptions",
        ["medicines"] = "Medicines",
        ["ledger"] = "Ledger & P&L",
        ["users"] = "Users"
    };

    private static IEnumerable<string> Mod(string module, params string[] actions) =>
        actions.Select(a => $"{module}:{a}");

    private static readonly string[] All4 = { "view", "create", "edit", "delete" };

    public static readonly IReadOnlyDictionary<string, string[]> RolePresets =
        new Dictionary<string, string[]>
        {
            ["Doctor"] = Mod("appointments", "view", "create", "edit")
                .Concat(Mod("doctors", "view"))
                .Concat(Mod("patients", "view", "create", "edit"))
                .Concat(Mod("prescriptions", All4))
                .Concat(Mod("medicines", All4)).ToArray(),
            ["Receptionist"] = Mod("appointments", "view", "create", "edit")
                .Concat(Mod("doctors", "view"))
                .Concat(Mod("patients", "view", "create", "edit"))
                .Concat(Mod("prescriptions", "view")).ToArray(),
            ["Assistant"] = Mod("appointments", "view")
                .Concat(Mod("patients", "view", "create", "edit"))
                .Concat(Mod("prescriptions", "view", "create", "edit"))
                .Concat(Mod("medicines", "view")).ToArray(),
            ["Accountant"] = Mod("ledger", All4)
                .Concat(Mod("appointments", "view"))
                .Concat(Mod("prescriptions", "view")).ToArray(),
            ["Manager"] = Modules.Where(m => m != "users").SelectMany(m => Mod(m, All4)).ToArray(),
            ["Custom"] = Array.Empty<string>()
        };

    public static IEnumerable<string> AllPermissionStrings() =>
        Modules.SelectMany(m => Actions.Select(a => $"{m}:{a}"));

    public static HashSet<string> Parse(string? raw)
    {
        var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (string.IsNullOrWhiteSpace(raw)) return set;
        foreach (var p in raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            set.Add(p);
        return set;
    }

    /// <summary>Keeps only known module:action pairs, adds the implied "view", removes duplicates
    /// and writes them in a stable order.</summary>
    public static string Sanitize(IEnumerable<string>? items)
    {
        var wanted = Parse(string.Join(",", items ?? Array.Empty<string>()));
        var keep = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var m in Modules)
        {
            var any = false;
            foreach (var a in Actions)
                if (wanted.Contains($"{m}:{a}")) { keep.Add($"{m}:{a}"); any = true; }
            if (any) keep.Add($"{m}:view");
        }
        return string.Join(",", AllPermissionStrings().Where(keep.Contains));
    }

    public static bool Allows(string? raw, string module, string action = "view") =>
        Parse(raw).Contains($"{module}:{action}");

    public static bool IsValidRole(string? role) =>
        !string.IsNullOrWhiteSpace(role) && RolePresets.ContainsKey(role);
}

internal static class ClinicRules
{
    /// <summary>Optional Indian mobile: empty is fine, otherwise it must normalise to 10 digits.</summary>
    public static IRuleBuilderOptions<T, string?> OptionalMobile<T>(this IRuleBuilder<T, string?> rule) =>
        rule.Must(p => string.IsNullOrWhiteSpace(p) || Common.PhoneNormalizer.ToIndianMobile(p) is not null)
            .WithMessage("Enter a valid 10-digit mobile number.");

    public static IRuleBuilderOptions<T, string> RequiredMobile<T>(this IRuleBuilder<T, string> rule) =>
        rule.NotEmpty().WithMessage("Mobile number is required.")
            .Must(p => Common.PhoneNormalizer.ToIndianMobile(p) is not null)
            .WithMessage("Enter a valid 10-digit mobile number.");

    public static string? Mobile(string? raw) =>
        string.IsNullOrWhiteSpace(raw) ? null : Common.PhoneNormalizer.ToIndianMobile(raw);
}