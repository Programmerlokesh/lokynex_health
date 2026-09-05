using LokynexHealth.Application.Ledger.Commands.RecordLedgerEntry;
using LokynexHealth.Application.Ledger.Commands.SyncLedgerFromOrders;
using LokynexHealth.Application.Ledger.Queries.GetLedgerSummary;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LedgerController : ControllerBase
{
    private readonly IMediator _mediator;

    public LedgerController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> Record([FromBody] RecordLedgerEntryCommand command, CancellationToken ct)
    {
        var id = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(Record), new { id }, new { id });
    }

    [HttpPost("sync")]
    public async Task<IActionResult> Sync([FromBody] SyncLedgerFromOrdersCommand command, CancellationToken ct)
    {
        var count = await _mediator.Send(command, ct);
        return Ok(new { synced = count });
    }

    [HttpGet("summary")]
    public async Task<IActionResult> Summary([FromQuery] GetLedgerSummaryQuery query, CancellationToken ct)
    {
        var result = await _mediator.Send(query, ct);
        return Ok(result);
    }
}