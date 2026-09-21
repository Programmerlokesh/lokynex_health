namespace LokynexHealth.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }

    /// <summary>
    /// The lab (tenant) this caller belongs to, read from the "tenant_id" JWT claim.
    /// Null for SuperAdmin tokens, and for legacy lab-user tokens issued before
    /// the claim existed — callers must treat null as "broadcast scope only".
    /// </summary>
    Guid? TenantId { get; }
    string? Username { get; }
    string? Role { get; }
    List<string> Permissions { get; }
    bool IsAuthenticated { get; }
}