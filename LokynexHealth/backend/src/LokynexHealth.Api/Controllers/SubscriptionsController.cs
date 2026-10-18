using LokynexHealth.Api.Security;
using LokynexHealth.Application.Subscriptions.Commands.CreateSubscription;
using LokynexHealth.Application.Subscriptions.Commands.UpdateSubscription;
using LokynexHealth.Application.Subscriptions.Queries.GetSubscriptions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

// SuperAdmin: all labs. Staff: only with the "subscriptions" panel, and only for
// the labs they added (enforced inside the handlers).
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Owner")]
[PlatformPanel("subscriptions")]
public class SubscriptionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SubscriptionsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    [PlatformPanel("subscriptions", write: true)]
    public async Task<IActionResult> Create([FromBody] CreateSubscriptionCommand command, CancellationToken ct)
    {
        var id = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(Create), new { id }, new { id });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetSubscriptionsQuery query, CancellationToken ct)
    {
        var result = await _mediator.Send(query, ct);
        return Ok(result);
    }

    [HttpPut("{id}")]
    [PlatformPanel("subscriptions", write: true)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSubscriptionCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }
}