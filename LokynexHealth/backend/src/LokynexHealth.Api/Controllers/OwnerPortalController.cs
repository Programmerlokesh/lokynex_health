using LokynexHealth.Api.Security;
using LokynexHealth.Application.OwnerLedger;
using LokynexHealth.Application.Owners;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

/// <summary>Everything the signed-in staff member can do about themselves: profile
/// (always) + own ledger (needs the "ledger" panel; Manage to add/edit/delete).
/// Handlers re-check that the staff member is still Active.</summary>
[ApiController]
[Route("api/owner")]
[Authorize(Roles = "Owner")]
public class OwnerPortalController : ControllerBase
{
    private readonly IMediator _mediator;
    public OwnerPortalController(IMediator mediator) => _mediator = mediator;

    // No panel needed: this is how the console learns which panels are open.
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct)
        => Ok(await _mediator.Send(new GetMyOwnerProfileQuery(), ct));

    // Staff edit their OWN details (name, phone, address, photo, password).
    // Role / Login ID / panel access / status are SuperAdmin-only and not accepted here.
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateMyOwnerProfileCommand command, CancellationToken ct)
    {
        await _mediator.Send(command, ct);
        return NoContent();
    }

    [HttpGet("ledger/analytics")]
    [PlatformPanel("ledger")]
    public async Task<IActionResult> Analytics([FromQuery] GetOwnerLedgerAnalyticsQuery query, CancellationToken ct)
    {
        query.OwnerId = null; // staff only ever see their own ledger
        return Ok(await _mediator.Send(query, ct));
    }

    [HttpGet("ledger/entries")]
    [PlatformPanel("ledger")]
    public async Task<IActionResult> Entries([FromQuery] GetOwnerLedgerEntriesQuery query, CancellationToken ct)
    {
        query.OwnerId = null;
        return Ok(await _mediator.Send(query, ct));
    }

    [HttpPost("ledger")]
    [PlatformPanel("ledger", write: true)]
    public async Task<IActionResult> Record([FromBody] RecordOwnerLedgerEntryCommand command, CancellationToken ct)
    {
        var id = await _mediator.Send(command, ct);
        return Ok(new { id });
    }

    [HttpPut("ledger/{id:guid}")]
    [PlatformPanel("ledger", write: true)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateOwnerLedgerEntryCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    [HttpDelete("ledger/{id:guid}")]
    [PlatformPanel("ledger", write: true)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteOwnerLedgerEntryCommand { Id = id }, ct);
        return NoContent();
    }
}