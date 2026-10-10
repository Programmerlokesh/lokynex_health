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
    // machine / chemical info (015). All run as ONE script, so a failure in any
    // part rolls the whole lab provisioning back instead of leaving half a schema.
    private static readonly string[] ScriptFiles =
    {
        "TenantSchemaTemplate.sql",
        "BloodReportFormats.sql",
        "BloodReportMachineChemical.sql",
        "BloodReportOptions.sql"
    };

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

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var createSchemaCmd = new NpgsqlCommand($"CREATE SCHEMA IF NOT EXISTS \"{schemaName}\";", connection);
        await createSchemaCmd.ExecuteNonQueryAsync(cancellationToken);

        await using var scriptCmd = new NpgsqlCommand(script.ToString(), connection);
        scriptCmd.CommandTimeout = 180;
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