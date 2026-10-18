using LokynexHealth.Application.OwnerLedger;
using LokynexHealth.Application.Owners;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

/// <summary>Everything the signed-in Owner can do about themselves: profile + own ledger.
/// (Labs live in LabsController.) Handlers re-check that the owner is still Active.</summary>
[ApiController]
[Route("api/owner")]
[Authorize(Roles = "Owner")]
public class OwnerPortalController : ControllerBase
{
    private readonly IMediator _mediator;
    public OwnerPortalController(IMediator mediator) => _mediator = mediator;

    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct)
        => Ok(await _mediator.Send(new GetMyOwnerProfileQuery(), ct));

    [HttpGet("ledger/analytics")]
    public async Task<IActionResult> Analytics([FromQuery] GetOwnerLedgerAnalyticsQuery query, CancellationToken ct)
    {
        query.OwnerId = null; // an Owner only ever sees their own ledger
        return Ok(await _mediator.Send(query, ct));
    }

    [HttpGet("ledger/entries")]
    public async Task<IActionResult> Entries([FromQuery] GetOwnerLedgerEntriesQuery query, CancellationToken ct)
    {
        query.OwnerId = null;
        return Ok(await _mediator.Send(query, ct));
    }

    [HttpPost("ledger")]
    public async Task<IActionResult> Record([FromBody] RecordOwnerLedgerEntryCommand command, CancellationToken ct)
    {
        var id = await _mediator.Send(command, ct);
        return Ok(new { id });
    }

    [HttpPut("ledger/{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateOwnerLedgerEntryCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    [HttpDelete("ledger/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteOwnerLedgerEntryCommand { Id = id }, ct);
        return NoContent();
    }
}