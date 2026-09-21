using LokynexHealth.Application.Notifications.Commands.MarkNotificationsRead;
using LokynexHealth.Application.Notifications.Queries.GetMyNotifications;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

/// <summary>
/// The lab-facing inbox. Deliberately separate from NotificationsController,
/// which is locked to SuperAdmin and sends/audits messages platform-wide —
/// this one only ever reads the caller's own lab, scoped from the JWT.
/// </summary>
[ApiController]
[Route("api/my/notifications")]
[Authorize]
public class MyNotificationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public MyNotificationsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetMine([FromQuery] GetMyNotificationsQuery query, CancellationToken ct)
    {
        var result = await _mediator.Send(query, ct);
        return Ok(result);
    }

    [HttpPost("read")]
    public async Task<IActionResult> MarkRead([FromBody] MarkNotificationsReadCommand? command, CancellationToken ct)
    {
        // No body = "mark everything read", which is what the bell's
        // mark-all-as-read action sends.
        command ??= new MarkNotificationsReadCommand();
        var updated = await _mediator.Send(command, ct);
        return Ok(new { updated });
    }
}