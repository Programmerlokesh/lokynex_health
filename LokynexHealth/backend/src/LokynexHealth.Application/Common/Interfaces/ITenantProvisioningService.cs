namespace LokynexHealth.Application.Common.Interfaces;

public interface ITenantProvisioningService
{
    Task ProvisionTenantSchemaAsync(string schemaName, CancellationToken cancellationToken);
}