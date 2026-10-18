using System.Security.Claims;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Owners;
using LokynexHealth.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Api.Security;

/// <summary>
/// Panel gate for the platform controllers.
///   SuperAdmin  -> always allowed.
///   Staff       -> allowed only if the SuperAdmin gave them that panel
///                  (write = true needs "manage", otherwise "view" is enough).
/// The permission is read from the DATABASE on every request, so a change made by the
/// SuperAdmin applies immediately — no re-login needed.
/// panels = "labs" or "labs|subscriptions" (any one of them is enough).
/// Put it on the class (view) and again on write actions (write: true); both must pass.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public sealed class PlatformPanelAttribute : TypeFilterAttribute
{
    public PlatformPanelAttribute(string panels, bool write = false)
        : base(typeof(PlatformPanelFilter))
    {
        Arguments = new object[] { panels, write };
    }
}

public sealed class PlatformPanelFilter : IAsyncAuthorizationFilter
{
    private readonly string _panels;
    private readonly bool _write;
    private readonly IApplicationDbContext _db;

    public PlatformPanelFilter(string panels, bool write, IApplicationDbContext db)
    {
        _panels = panels;
        _write = write;
        _db = db;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;
        var tokenType = user.FindFirstValue("token_type");

        if (tokenType == "SuperAdmin") return;

        if (tokenType != "Owner")
        {
            context.Result = Forbidden("You do not have access to this panel.");
            return;
        }

        if (!Guid.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var id))
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        var staff = await _db.Owners.AsNoTracking()
            .Where(o => o.Id == id)
            .Select(o => new { o.Status, o.Permissions })
            .FirstOrDefaultAsync(context.HttpContext.RequestAborted);

        // Unknown or deactivated -> 401 so the frontend signs them out.
        if (staff is null || staff.Status != PlatformRecordStatus.Active)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        if (!StaffPanels.Allows(staff.Permissions, _panels, _write))
        {
            context.Result = Forbidden(_write
                ? "You only have view access to this panel."
                : "The SuperAdmin has not given you access to this panel.");
        }
    }

    private static ObjectResult Forbidden(string message) =>
        new(new { status = 403, title = "Forbidden", errors = new[] { message } })
        {
            StatusCode = StatusCodes.Status403Forbidden
        };
}