using LokynexHealth.Application.Technicians.Commands.CreateTechnician;
using LokynexHealth.Application.Technicians.Commands.ManageTechnician;
using LokynexHealth.Application.Technicians.Queries.GetTechnicians;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TechniciansController : ControllerBase
{
    private readonly IMediator _mediator;

    public TechniciansController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTechnicianCommand command, CancellationToken ct)
    {
        var id = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(Create), new { id }, new { id });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetTechniciansQuery query, CancellationToken ct)
    {
        var result = await _mediator.Send(query, ct);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTechnicianCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> SetStatus(Guid id, [FromBody] SetTechnicianStatusCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "LabAdmin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteTechnicianCommand { Id = id }, ct);
        return NoContent();
    }
}