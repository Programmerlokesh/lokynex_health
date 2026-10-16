using LokynexHealth.Application.Referrals.Commands.CreateReferral;
using LokynexHealth.Application.Referrals.Commands.ManageReferral;
using LokynexHealth.Application.Referrals.Queries.GetReferrals;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReferralsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ReferralsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReferralCommand command, CancellationToken ct)
    {
        var id = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(Create), new { id }, new { id });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetReferralsQuery query, CancellationToken ct)
    {
        var result = await _mediator.Send(query, ct);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateReferralCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> SetStatus(Guid id, [FromBody] SetReferralStatusCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    // Referrals are shared by EVERY lab, so permanent delete is LabAdmin-only.
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "LabAdmin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteReferralCommand { Id = id }, ct);
        return NoContent();
    }
}