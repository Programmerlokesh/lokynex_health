using LokynexHealth.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace LokynexHealth.Infrastructure.Persistence;

public class TenantProvisioningService : ITenantProvisioningService
{
    private readonly IConfiguration _configuration;

    public TenantProvisioningService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task ProvisionTenantSchemaAsync(string schemaName, CancellationToken cancellationToken)
    {
        // Rule: schema name is sanitized BEFORE it ever reaches this method (Section D,
        // GenerateUniqueSchemaNameAsync), but we double-check here too — never trust a
        // string that ends up inside raw, non-parameterized SQL (schema names can't be
        // parameterized like normal values in Npgsql, so this defensive check matters).
        if (!System.Text.RegularExpressions.Regex.IsMatch(schemaName, "^[a-z][a-z0-9_]{2,62}$"))
            throw new ArgumentException("Invalid schema name.", nameof(schemaName));

        var connectionString = _configuration.GetConnectionString("TenantDb");

        // NOTE (dev-time pragmatic approach): the tenant template script's actual file path.
        // In production this should be an embedded resource inside the Infrastructure
        // assembly (Build Action: Embedded Resource) so it ships with the deployed app
        // instead of depending on a file path on disk.
        var templatePath = _configuration["TenantProvisioning:TemplateScriptPath"]
            ?? throw new InvalidOperationException("TenantProvisioning:TemplateScriptPath is not configured.");

        var templateSql = await File.ReadAllTextAsync(templatePath, cancellationToken);

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var createSchemaCmd = new NpgsqlCommand($"CREATE SCHEMA IF NOT EXISTS \"{schemaName}\";", connection);
        await createSchemaCmd.ExecuteNonQueryAsync(cancellationToken);

        // search_path + the full multi-statement template script run as one batch —
        // mirrors exactly what was done manually via psql \i during development.
        var fullScript = $"SET search_path TO \"{schemaName}\", public;\n{templateSql}";
        await using var scriptCmd = new NpgsqlCommand(fullScript, connection);
        scriptCmd.CommandTimeout = 120;   // schema creation runs many statements — give it room
        await scriptCmd.ExecuteNonQueryAsync(cancellationToken);
    }
}