using LokynexHealth.Application.Roles.Queries.GetRoles;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

// LabAdmin-only lookup list — powers the Role dropdown on Create/Edit User.
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "LabAdmin")]
public class RolesController : ControllerBase
{
    private readonly IMediator _mediator;

    public RolesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetRoles(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetRolesQuery(), cancellationToken);
        return Ok(result);
    }
}