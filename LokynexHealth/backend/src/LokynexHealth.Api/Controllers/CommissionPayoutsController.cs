using LokynexHealth.Application.CommissionPayouts.Commands.GeneratePayouts;
using LokynexHealth.Application.CommissionPayouts.Commands.MarkPayoutsPaid;
using LokynexHealth.Application.CommissionPayouts.Queries.GetPayouts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CommissionPayoutsController : ControllerBase
{
    private readonly IMediator _mediator;

    public CommissionPayoutsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromBody] GeneratePayoutsCommand command, CancellationToken ct)
    {
        var count = await _mediator.Send(command, ct);
        return Ok(new { generated = count });
    }

    [HttpPost("mark-paid")]
    public async Task<IActionResult> MarkPaid([FromBody] MarkPayoutsPaidCommand command, CancellationToken ct)
    {
        var count = await _mediator.Send(command, ct);
        return Ok(new { updated = count });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetPayoutsQuery query, CancellationToken ct)
    {
        var result = await _mediator.Send(query, ct);
        return Ok(result);
    }
}