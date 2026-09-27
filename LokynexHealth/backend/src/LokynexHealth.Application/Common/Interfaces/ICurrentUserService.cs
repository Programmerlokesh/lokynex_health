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

    /// <summary>
    /// Read from the "token_type" JWT claim: "Lab" (a row in the tenant's own
    /// `users` table), "TenantAdmin" (the lab-owner account created at
    /// onboarding — lives only in platform.tenants, has no `users` row), or
    /// "SuperAdmin". Callers that touch the tenant `users` table by UserId
    /// (e.g. GetMyProfile) must branch on this: a TenantAdmin's UserId is a
    /// tenant ID, not a `users.id`, and looking it up there will 404.
    /// </summary>
    string? TokenType { get; }

    /// <summary>Convenience for TokenType == "TenantAdmin".</summary>
    bool IsTenantAdmin { get; }
}