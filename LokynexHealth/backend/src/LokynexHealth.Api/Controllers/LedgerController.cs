using LokynexHealth.Application.Ledger.Commands.DeleteLedgerEntry;
using LokynexHealth.Application.Ledger.Commands.RecordLedgerEntry;
using LokynexHealth.Application.Ledger.Commands.SyncLedgerFromOrders;
using LokynexHealth.Application.Ledger.Commands.UpdateLedgerEntry;
using LokynexHealth.Application.Ledger.Queries.GetLedgerAnalytics;
using LokynexHealth.Application.Ledger.Queries.GetLedgerEntries;
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

    [HttpGet("entries")]
    public async Task<IActionResult> Entries([FromQuery] GetLedgerEntriesQuery query, CancellationToken ct)
    {
        var result = await _mediator.Send(query, ct);
        return Ok(result);
    }

    [HttpGet("analytics")]
    public async Task<IActionResult> Analytics([FromQuery] GetLedgerAnalyticsQuery query, CancellationToken ct)
    {
        var result = await _mediator.Send(query, ct);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateLedgerEntryCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteLedgerEntryCommand { Id = id }, ct);
        return NoContent();
    }
}