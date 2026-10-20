namespace LokynexHealth.Application.Common.Interfaces;

public static class CurrentUserExtensions
{
    /// <summary>
    /// Id that is safe to store in a `users(id)` foreign key column.
    /// Lab Admin (TenantAdmin) and Clinic Admin have no row in the tenant `users`
    /// table, so we return null for them (the FK stays valid).
    /// </summary>
    public static Guid? ActorUserId(this ICurrentUserService user) =>
        user.IsTenantAdmin || user.IsClinicAdmin ? null : user.UserId;
}