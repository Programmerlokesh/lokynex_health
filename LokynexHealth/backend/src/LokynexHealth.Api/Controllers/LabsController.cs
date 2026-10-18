using LokynexHealth.Application.Labs.Commands.AddLabBranch;
using LokynexHealth.Application.Labs.Commands.CreateLab;
using LokynexHealth.Application.Labs.Commands.DeleteLabBranch;
using LokynexHealth.Application.Labs.Commands.SendRenewalReminder;
using LokynexHealth.Application.Labs.Commands.UpdateLab;
using LokynexHealth.Application.Labs.Commands.UpdateLabBranch;
using LokynexHealth.Application.Labs.Queries.GetLabById;
using LokynexHealth.Application.Labs.Queries.GetLabs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

// Class level: SuperAdmin OR Owner may reach this controller. Every action
// below that an Owner must NOT use carries its own [Authorize(Roles = "SuperAdmin")];
// ASP.NET combines attributes with AND, so those actions are SuperAdmin-only.
// An Owner can: create a lab, list the labs they added, open one of them.
// An Owner can never edit/delete anything, and there is no "delete lab" at all.
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Owner")]
public class LabsController : ControllerBase
{
    private readonly IMediator _mediator;

    public LabsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLabCommand command, CancellationToken ct)
    {
        var id = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetLabsQuery query, CancellationToken ct)
    {
        var result = await _mediator.Send(query, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetLabByIdQuery { Id = id }, ct);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateLabCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    // ---------- Branches (SuperAdmin only) ----------

    [HttpPost("{id:guid}/branches")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> AddBranch(Guid id, [FromBody] AddLabBranchCommand command, CancellationToken ct)
    {
        // Route id always wins over anything in the body, so a mismatched payload
        // can't attach a branch to a different lab.
        command.LabId = id;
        var branchId = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id }, new { id = branchId });
    }

    [HttpPut("{id:guid}/branches/{branchId:guid}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> UpdateBranch(
        Guid id, Guid branchId, [FromBody] UpdateLabBranchCommand command, CancellationToken ct)
    {
        command.LabId = id;
        command.BranchId = branchId;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}/branches/{branchId:guid}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> DeleteBranch(Guid id, Guid branchId, CancellationToken ct)
    {
        await _mediator.Send(new DeleteLabBranchCommand { LabId = id, BranchId = branchId }, ct);
        return NoContent();
    }

    // ---------- Subscription renewal (SuperAdmin only) ----------

    [HttpPost("{id:guid}/renewal-reminder")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> SendRenewalReminder(
        Guid id,
        [FromBody] SendRenewalReminderCommand? command,
        CancellationToken ct)
    {
        command ??= new SendRenewalReminderCommand();
        command.LabId = id;
        var notificationId = await _mediator.Send(command, ct);
        return Ok(new { id = notificationId });
    }
}