using LokynexHealth.Application.OwnerLedger;
using LokynexHealth.Application.Owners;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

/// <summary>SuperAdmin manages owners: create, edit, activate/deactivate (never delete),
/// and read any owner's ledger.</summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class OwnersController : ControllerBase
{
    private readonly IMediator _mediator;
    public OwnersController(IMediator mediator) => _mediator = mediator;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOwnerCommand command, CancellationToken ct)
    {
        var id = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetOwnersQuery query, CancellationToken ct)
        => Ok(await _mediator.Send(query, ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => Ok(await _mediator.Send(new GetOwnerByIdQuery { Id = id }, ct));

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateOwnerCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    public class SetStatusBody { public string Status { get; set; } = default!; }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> SetStatus(Guid id, [FromBody] SetStatusBody body, CancellationToken ct)
    {
        await _mediator.Send(new SetOwnerStatusCommand { Id = id, Status = body.Status }, ct);
        return NoContent();
    }

    // ---------- read-only view of an owner's ledger ----------

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