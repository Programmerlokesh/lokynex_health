using LokynexHealth.Application.OwnerLedger;
using LokynexHealth.Application.Owners;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

/// <summary>SuperAdmin-only: create / edit / activate-deactivate staff (Owner) accounts,
/// assign their panel access, and read any staff member's ledger.
/// (What a staff member can do about themselves lives in OwnerPortalController.)</summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class OwnersController : ControllerBase
{
    private readonly IMediator _mediator;
    public OwnersController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetOwnersQuery query, CancellationToken ct)
        => Ok(await _mediator.Send(query, ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => Ok(await _mediator.Send(new GetOwnerByIdQuery { Id = id }, ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOwnerCommand command, CancellationToken ct)
    {
        var id = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateOwnerCommand command, CancellationToken ct)
    {
        command.Id = id; // route id always wins over the body
        await _mediator.Send(command, ct);
        return NoContent();
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> SetStatus(Guid id, [FromBody] SetOwnerStatusCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    // ---------- A staff member's ledger (read-only for the SuperAdmin) ----------

    [HttpGet("{id:guid}/ledger/analytics")]
    public async Task<IActionResult> LedgerAnalytics(Guid id, [FromQuery] GetOwnerLedgerAnalyticsQuery query, CancellationToken ct)
    {
        query.OwnerId = id;
        return Ok(await _mediator.Send(query, ct));
    }

    [HttpGet("{id:guid}/ledger/entries")]
    public async Task<IActionResult> LedgerEntries(Guid id, [FromQuery] GetOwnerLedgerEntriesQuery query, CancellationToken ct)
    {
        query.OwnerId = id;
        return Ok(await _mediator.Send(query, ct));
    }
}