using LokynexHealth.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Orders.Common;

/// <summary>
/// Who is doing the action. <see cref="UserId"/> is null for the Lab Admin (no row in
/// `users`, so storing an id would break the foreign key) — the NAME is what we show.
/// </summary>
public readonly record struct OrderActor(Guid? UserId, string Name);

public static class OrderActorResolver
{
    public static async Task<OrderActor> ResolveAsync(
        IApplicationDbContext db, ICurrentUserService currentUser, CancellationToken ct)
    {
        var fallback = string.IsNullOrWhiteSpace(currentUser.Username) ? "Unknown" : currentUser.Username!;

        if (currentUser.IsTenantAdmin || currentUser.UserId is null)
            return new OrderActor(null, fallback);

        var id = currentUser.UserId.Value;
        var name = await db.Users.AsNoTracking()
            .Where(u => u.Id == id)
            .Select(u => u.Name)
            .FirstOrDefaultAsync(ct);

        // Token for a user that no longer exists: keep the name, drop the id (FK safety).
        return name is null
            ? new OrderActor(null, fallback)
            : new OrderActor(id, string.IsNullOrWhiteSpace(name) ? fallback : name);
    }
}