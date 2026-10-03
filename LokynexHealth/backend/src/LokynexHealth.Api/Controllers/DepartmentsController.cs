using LokynexHealth.Application.Departments.Commands.CreateDepartment;
using LokynexHealth.Application.Departments.Commands.DeleteDepartment;
using LokynexHealth.Application.Departments.Commands.UpdateDepartmentStatus;
using LokynexHealth.Application.Departments.Queries.GetDepartments;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DepartmentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public DepartmentsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDepartmentCommand command, CancellationToken ct)
    {
        var id = await _mediator.Send(command, ct);
        return StatusCode(StatusCodes.Status201Created, new { id });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetDepartmentsQuery(), ct);
        return Ok(result);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateDepartmentStatusCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteDepartmentCommand { Id = id }, ct);
        return NoContent();
    }
}