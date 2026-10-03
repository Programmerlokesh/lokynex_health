using LokynexHealth.Application.CommissionOverrides.Commands.BulkSetCommissionOverrides;
using LokynexHealth.Application.CommissionOverrides.Commands.SetCommissionOverride;
using LokynexHealth.Application.CommissionOverrides.Queries.GetEffectiveCommissions;
using LokynexHealth.Application.CommissionOverrides.Queries.GetCommissionOverrides;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CommissionOverridesController : ControllerBase
{
    private readonly IMediator _mediator;

    public CommissionOverridesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> Set([FromBody] SetCommissionOverrideCommand command, CancellationToken ct)
    {
        var id = await _mediator.Send(command, ct);
        return Ok(new { id });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetCommissionOverridesQuery query, CancellationToken ct)
    {
        var result = await _mediator.Send(query, ct);
        return Ok(result);
    }

    /// <summary>Commission Setup: every test of a department with this person's effective commission.</summary>
    [HttpGet("effective")]
    public async Task<IActionResult> GetEffective([FromQuery] GetEffectiveCommissionsQuery query, CancellationToken ct)
    {
        var result = await _mediator.Send(query, ct);
        return Ok(result);
    }

    /// <summary>Commission Setup: save many tests of one department for one person.</summary>
    [HttpPut("bulk")]
    public async Task<IActionResult> Bulk([FromBody] BulkSetCommissionOverridesCommand command, CancellationToken ct)
    {
        var changed = await _mediator.Send(command, ct);
        return Ok(new { changed });
    }
}