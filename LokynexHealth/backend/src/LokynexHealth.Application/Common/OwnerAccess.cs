using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Common;

public static class OwnerAccess
{
    public const string OwnerToken = "Owner";
    public const string SuperAdminToken = "SuperAdmin";

    /// <summary>The caller must be a staff member ("Owner" token) whose account is still
    /// Active. A deactivated staff member loses access immediately, even with a valid
    /// token (401 makes the frontend sign them out).</summary>
    public static async Task<Owner> RequireActiveOwnerAsync(
        IApplicationDbContext db, ICurrentUserService user, CancellationToken ct)
    {
        if (user.TokenType != OwnerToken || user.UserId is null)
            throw new UnauthorizedException("Staff access only.");

        var id = user.UserId.Value;
        var owner = await db.Owners.AsNoTracking().FirstOrDefaultAsync(o => o.Id == id, ct);
        if (owner is null || owner.Status != PlatformRecordStatus.Active)
            throw new UnauthorizedException("This staff account is deactivated.");
        return owner;
    }

    /// <summary>null = unrestricted (SuperAdmin). For a staff member: the ids of the
    /// labs THEY added — the only labs they may subscribe / notify / read.</summary>
    public static async Task<List<Guid>?> ScopedTenantIdsAsync(
        IApplicationDbContext db, ICurrentUserService user, CancellationToken ct)
    {
        if (user.TokenType != OwnerToken) return null;
        var owner = await RequireActiveOwnerAsync(db, user, ct);
        return await db.Tenants.AsNoTracking()
            .Where(t => t.CreatedByOwnerId == owner.Id)
            .Select(t => t.Id)
            .ToListAsync(ct);
    }

    /// <summary>Whose ledger is being read: a staff member always gets their OWN (the
    /// requested id is ignored); a SuperAdmin must name an existing staff member.</summary>
    public static async Task<Guid> ResolveLedgerOwnerIdAsync(
        IApplicationDbContext db, ICurrentUserService user, Guid? requestedOwnerId, CancellationToken ct)
    {
        if (user.TokenType == SuperAdminToken)
        {
            if (requestedOwnerId is null) throw new NotFoundException("Owner", Guid.Empty);
            var id = requestedOwnerId.Value;
            if (!await db.Owners.AnyAsync(o => o.Id == id, ct))
                throw new NotFoundException("Owner", id);
            return id;
        }
        return (await RequireActiveOwnerAsync(db, user, ct)).Id;
    }
}