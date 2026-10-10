using LokynexHealth.Application.ReportOptions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportOptionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ReportOptionsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // Machines / reagents the lab can pick from. ?kind=Machine | Reagent (empty = both)
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? kind, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetReportOptionsQuery { Kind = kind }, ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReportOptionCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteReportOptionCommand { Id = id }, ct);
        return NoContent();
    }
}