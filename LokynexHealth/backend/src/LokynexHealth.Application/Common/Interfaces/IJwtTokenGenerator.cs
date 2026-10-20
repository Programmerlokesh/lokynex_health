using LokynexHealth.Domain.Entities;

namespace LokynexHealth.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user, string roleName, List<string> permissions);
    string GenerateSuperAdminToken(Guid superAdminId, string username);
    string GenerateTenantAdminToken(Guid tenantId, string username, string name, string schemaName, string labCode);
    string GenerateOwnerToken(Guid ownerId, string username, string name, string role);

    /// <summary>Doctor Clinic token. isAdmin = the clinic's main account; otherwise a clinic user.</summary>
    string GenerateClinicToken(Guid clinicId, Guid actorId, bool isAdmin, string name, string clinicRole, IEnumerable<string> permissions);
}