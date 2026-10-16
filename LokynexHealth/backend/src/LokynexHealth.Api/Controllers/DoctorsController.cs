using LokynexHealth.Application.Doctors.Commands.CreateDoctor;
using LokynexHealth.Application.Doctors.Commands.ManageDoctor;
using LokynexHealth.Application.Doctors.Queries.GetDoctors;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DoctorsController : ControllerBase
{
    private readonly IMediator _mediator;

    public DoctorsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDoctorCommand command, CancellationToken ct)
    {
        var id = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(Create), new { id }, new { id });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetDoctorsQuery query, CancellationToken ct)
    {
        var result = await _mediator.Send(query, ct);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDoctorCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> SetStatus(Guid id, [FromBody] SetDoctorStatusCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    // Doctors are shared by EVERY lab, so permanent delete is LabAdmin-only.
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "LabAdmin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteDoctorCommand { Id = id }, ct);
        return NoContent();
    }
}