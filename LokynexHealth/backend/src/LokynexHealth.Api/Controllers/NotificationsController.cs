using LokynexHealth.Api.Security;
using LokynexHealth.Application.Notifications.Commands.SendNotification;
using LokynexHealth.Application.Notifications.Queries.GetNotifications;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

// SuperAdmin: all labs + broadcast. Staff: only with the "notifications" panel, and
// only to/for the labs they added (enforced inside the handlers; no broadcast).
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Owner")]
[PlatformPanel("notifications")]
public class NotificationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public NotificationsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    [PlatformPanel("notifications", write: true)]
    public async Task<IActionResult> Send([FromBody] SendNotificationCommand command, CancellationToken ct)
    {
        var id = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(Send), new { id }, new { id });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetNotificationsQuery query, CancellationToken ct)
    {
        var result = await _mediator.Send(query, ct);
        return Ok(result);
    }
}