using LokynexHealth.Application.ModuleCatalog.Queries.GetModules;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

// LabAdmin-only lookup list — powers the permission grid on Create/Edit User.
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "LabAdmin")]
public class ModulesController : ControllerBase
{
    private readonly IMediator _mediator;

    public ModulesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetModules(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetModulesQuery(), cancellationToken);
        return Ok(result);
    }
}