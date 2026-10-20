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

    // Embedded copies of the two files in the /database folder:
    //   database/002_tenant_schema.sql           -> Scripts/TenantSchema.sql
    //   database/003_departments_and_tests.sql   -> Scripts/DepartmentsAndTests.sql
    // Order matters: the schema first, then the test catalog.
    // Everything runs as ONE script (one implicit transaction), so a failure in any
    // part rolls the whole lab provisioning back, including the CREATE SCHEMA.
    private const string TenantSchemaFile = "TenantSchema.sql";
    private const string DepartmentsAndTestsFile = "DepartmentsAndTests.sql";

    // The standalone SQL files may contain "SET search_path TO lab_demo, public;".
    // Remove it here: the schema of the NEW lab is set once at the top instead.
    private static readonly Regex SearchPathStatement = new(
        @"^[ \t]*SET[ \t]+search_path[ \t]+TO[^;\r\n]*;",
        RegexOptions.Multiline | RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex ValidSchemaName = new(
        "^[a-z][a-z0-9_]{2,62}$", RegexOptions.Compiled);

    private readonly IConfiguration _configuration;

    public TenantProvisioningService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task ProvisionTenantSchemaAsync(string schemaName, CancellationToken cancellationToken)
    {
        if (!ValidSchemaName.IsMatch(schemaName))
            throw new ArgumentException("Invalid schema name.", nameof(schemaName));

        var connectionString = _configuration.GetConnectionString("TenantDb");

        var tenantSchemaSql = Normalize(await ReadEmbeddedScriptAsync(TenantSchemaFile, cancellationToken));
        var catalogSql = Normalize(await ReadEmbeddedScriptAsync(DepartmentsAndTestsFile, cancellationToken));

        var script = new StringBuilder();

        // 1) create + point the session at the new lab schema
        script.Append($"CREATE SCHEMA IF NOT EXISTS \"{schemaName}\";\n");
        script.Append($"SET search_path TO \"{schemaName}\", public;\n");

        // 2) tables, enums, triggers, views of one lab
        script.Append(tenantSchemaSql);
        script.Append("\n;\n");

        // 3) test catalog. 003 loops over EVERY lab schema unless this setting is set,
        //    so limit it to the new schema only (the existing labs are never touched).
        script.Append($"SELECT set_config('lokynex.only_schema', '{schemaName}', false);\n");
        script.Append(catalogSql);
        script.Append("\n;\n");

        // 4) clean up the session before it goes back to the connection pool
        script.Append("SELECT set_config('lokynex.only_schema', '', false);\n");
        script.Append("RESET search_path;\n");

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var scriptCmd = new NpgsqlCommand(script.ToString(), connection);
        scriptCmd.CommandTimeout = 600; // the test catalog seed adds a few seconds
        await scriptCmd.ExecuteNonQueryAsync(cancellationToken);
    }

    private static string Normalize(string sql) =>
        SearchPathStatement.Replace(sql.Replace("\r\n", "\n"), string.Empty);

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