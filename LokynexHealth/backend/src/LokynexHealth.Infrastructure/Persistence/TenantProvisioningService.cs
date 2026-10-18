using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using LokynexHealth.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace LokynexHealth.Infrastructure.Persistence;

public class TenantProvisioningService : ITenantProvisioningService
{
    private const string ResourcePrefix = "LokynexHealth.Infrastructure.Persistence.Scripts.";

    // Order matters: base tables first, then blood-report formats (014) and
    // machine / chemical info (015), then the per-lab doctor/referral overrides.
    // All run as ONE script, so a failure in any part rolls the whole lab
    // provisioning back instead of leaving half a schema.
    private static readonly string[] ScriptFiles =
    {
        "TenantSchemaTemplate.sql",
        "BloodReportFormats.sql",
        "BloodReportMachineChemical.sql",
        "BloodReportOptions.sql",
        "DirectoryOverrides.sql"
    };

    // Test catalog (departments + tests + report formats). Same content as
    // database/019, 017, 020, 021, 026, 027. ORDER MATTERS (020 expects 017's
    // formats first). Every script is safe to re-run and never overwrites
    // anything the lab edited, so a new lab starts with the full catalog and
    // nobody has to run these by hand in the Neon SQL editor.
    private static readonly string[] SeedFiles =
    {
        "SeedTests01_BloodTests.sql",
        "SeedTests02_BloodFormats.sql",
        "SeedTests03_SopPack.sql",
        "SeedTests04_PanelFormats.sql",
        "SeedTests05_OtherTests.sql",
        "SeedTests06_MoreTests.sql"
    };

    // The seed scripts loop over EVERY lab schema. During provisioning we only
    // want the NEW schema (the first entry of search_path), so the loop filter
    // gets one extra condition.
    private const string SeedSchemaFilter =
        "NOT IN ('public', 'platform', 'information_schema', 'pg_catalog')";
    private const string SeedSchemaFilterScoped =
        "NOT IN ('public', 'platform', 'information_schema', 'pg_catalog') AND i.table_schema = current_schema()";

    // The standalone SQL files start with "SET search_path TO lab_demo, public;".
    // Remove it here: the schema of the NEW lab is set once at the top instead.
    private static readonly Regex SearchPathStatement = new(
        @"^[ \t]*SET[ \t]+search_path[ \t]+TO[^;\r\n]*;",
        RegexOptions.Multiline | RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private readonly IConfiguration _configuration;

    public TenantProvisioningService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task ProvisionTenantSchemaAsync(string schemaName, CancellationToken cancellationToken)
    {
        if (!System.Text.RegularExpressions.Regex.IsMatch(schemaName, "^[a-z][a-z0-9_]{2,62}$"))
            throw new ArgumentException("Invalid schema name.", nameof(schemaName));

        var connectionString = _configuration.GetConnectionString("TenantDb");

        var script = new StringBuilder();
        script.Append($"SET search_path TO \"{schemaName}\", public;\n");
        foreach (var file in ScriptFiles)
        {
            var sql = await ReadEmbeddedScriptAsync(file, cancellationToken);
            script.Append(SearchPathStatement.Replace(sql, string.Empty));
            script.Append("\n;\n");
        }

        foreach (var file in SeedFiles)
        {
            var sql = await ReadEmbeddedScriptAsync(file, cancellationToken);
            sql = SearchPathStatement.Replace(sql, string.Empty);
            // normalise Windows line endings and limit the seed to the new schema
            sql = sql.Replace("\r\n", "\n").Replace(SeedSchemaFilter, SeedSchemaFilterScoped);
            script.Append(sql);
            script.Append("\n;\n");
        }

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var createSchemaCmd = new NpgsqlCommand($"CREATE SCHEMA IF NOT EXISTS \"{schemaName}\";", connection);
        await createSchemaCmd.ExecuteNonQueryAsync(cancellationToken);

        await using var scriptCmd = new NpgsqlCommand(script.ToString(), connection);
        scriptCmd.CommandTimeout = 600; // the test catalog seed adds a few seconds
        await scriptCmd.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task<string> ReadEmbeddedScriptAsync(string fileName, CancellationToken cancellationToken)
    {
        var resourceName = ResourcePrefix + fileName;
        var assembly = Assembly.GetExecutingAssembly();
        await using var stream = assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException(
                $"Embedded resource '{resourceName}' not found. Check the .csproj EmbeddedResource entry.");

        using var reader = new StreamReader(stream);
        return await reader.ReadToEndAsync(cancellationToken);
    }
}