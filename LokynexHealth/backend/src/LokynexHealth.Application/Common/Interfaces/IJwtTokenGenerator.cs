using LokynexHealth.Domain.Entities;

namespace LokynexHealth.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user, string roleName, List<string> permissions);
    string GenerateSuperAdminToken(Guid superAdminId, string username);
    string GenerateTenantAdminToken(Guid tenantId, string username, string name, string schemaName, string labCode);
}