using System.Security.Claims;
using LokynexHealth.Application.Clinics;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Api.Security;

/// <summary>
/// Guard for every Doctor-Clinic endpoint (the clinic version of PlatformPanel).
///   [ClinicPermission("prescriptions")]            -> needs prescriptions:view
///   [ClinicPermission("prescriptions", "create")]  -> needs prescriptions:create
///   [ClinicPermission("admin")]                    -> clinic admin only
///   [ClinicPermission]                             -> any signed-in clinic account
/// ClinicAdmin passes every module check. For a clinic user the permissions are read from the
/// DATABASE on each request, so a change made by the admin applies immediately and a deactivated
/// user (or suspended clinic) gets 401 and is signed out by the frontend.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public sealed class ClinicPermissionAttribute : TypeFilterAttribute
{
    public ClinicPermissionAttribute(string module = "", string action = "view")
        : base(typeof(ClinicPermissionFilter))
    {
        Arguments = new object[] { module, action };
    }
}

public sealed class ClinicPermissionFilter : IAsyncAuthorizationFilter
{
    private readonly string _module;
    private readonly string _action;
    private readonly IApplicationDbContext _db;

    public ClinicPermissionFilter(string module, string action, IApplicationDbContext db)
    {
        _module = module;
        _action = action;
        _db = db;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;
        var tokenType = user.FindFirstValue("token_type");
        var ct = context.HttpContext.RequestAborted;

        if (tokenType is not (ClinicTokens.Admin or ClinicTokens.User)
            || !Guid.TryParse(user.FindFirstValue("clinic_id"), out var clinicId)
            || !Guid.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var actorId))
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        var clinicStatus = await _db.Clinics.AsNoTracking().Where(c => c.Id == clinicId)
            .Select(c => c.Status).FirstOrDefaultAsync(ct);
        if (clinicStatus != ClinicStatus.Active)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        if (tokenType == ClinicTokens.Admin)
        {
            if (actorId != clinicId) context.Result = new UnauthorizedResult();
            return;   // the admin may do everything inside their own clinic
        }

        var row = await _db.ClinicUsers.AsNoTracking().Where(u => u.Id == actorId && u.ClinicId == clinicId)
            .Select(u => new { u.Status, u.Permissions }).FirstOrDefaultAsync(ct);
        if (row is null || row.Status != ClinicStatus.Active)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        if (_module == "") return;   // any active clinic user
        if (_module == "admin" || !ClinicPermissions.Allows(row.Permissions, _module, _action))
        {
            context.Result = new ObjectResult(new
            {
                status = 403,
                title = "Forbidden",
                errors = new[] { "You do not have permission to do this." }
            })
            { StatusCode = StatusCodes.Status403Forbidden };
        }
    }
}