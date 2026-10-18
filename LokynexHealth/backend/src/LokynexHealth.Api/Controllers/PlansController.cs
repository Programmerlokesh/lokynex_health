using LokynexHealth.Api.Security;
using LokynexHealth.Application.Plans.Commands.CreatePlan;
using LokynexHealth.Application.Plans.Commands.DeletePlan;
using LokynexHealth.Application.Plans.Commands.UpdatePlan;
using LokynexHealth.Application.Plans.Queries.GetPlans;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

// SuperAdmin: everything. Staff: only with the "plans" panel (view to read,
// manage to create/edit/delete). The plan list is also readable with the
// "subscriptions" panel, because the subscription form needs a plan dropdown.
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Owner")]
[PlatformPanel("plans|subscriptions")]
public class PlansController : ControllerBase
{
    private readonly IMediator _mediator;

    public PlansController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    [PlatformPanel("plans", write: true)]
    public async Task<IActionResult> Create([FromBody] CreatePlanCommand command, CancellationToken ct)
    {
        var id = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(Create), new { id }, new { id });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetPlansQuery(), ct);
        return Ok(result);
    }

    [HttpPut("{id}")]
    [PlatformPanel("plans", write: true)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePlanCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [PlatformPanel("plans", write: true)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeletePlanCommand { Id = id }, ct);
        return NoContent();
    }
}