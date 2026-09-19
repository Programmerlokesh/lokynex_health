using System.Reflection;
using LokynexHealth.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace LokynexHealth.Infrastructure.Persistence;

public class TenantProvisioningService : ITenantProvisioningService
{
    private const string TemplateResourceName =
        "LokynexHealth.Infrastructure.Persistence.Scripts.TenantSchemaTemplate.sql";

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

        var templateSql = await ReadEmbeddedTemplateAsync(cancellationToken);

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var createSchemaCmd = new NpgsqlCommand($"CREATE SCHEMA IF NOT EXISTS \"{schemaName}\";", connection);
        await createSchemaCmd.ExecuteNonQueryAsync(cancellationToken);

        var fullScript = $"SET search_path TO \"{schemaName}\", public;\n{templateSql}";
        await using var scriptCmd = new NpgsqlCommand(fullScript, connection);
        scriptCmd.CommandTimeout = 120;
        await scriptCmd.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task<string> ReadEmbeddedTemplateAsync(CancellationToken cancellationToken)
    {
        var assembly = Assembly.GetExecutingAssembly();
        await using var stream = assembly.GetManifestResourceStream(TemplateResourceName)
            ?? throw new InvalidOperationException(
                $"Embedded resource '{TemplateResourceName}' not found. Check the .csproj EmbeddedResource entry.");

        using var reader = new StreamReader(stream);
        return await reader.ReadToEndAsync(cancellationToken);
    }
}