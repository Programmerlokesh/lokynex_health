using LokynexHealth.Application.SuperAdmins;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

/// <summary>The signed-in SuperAdmin managing THEIR OWN account (profile + password).</summary>
[ApiController]
[Route("api/superadmin")]
[Authorize(Roles = "SuperAdmin")]
public class SuperAdminPortalController : ControllerBase
{
    private readonly IMediator _mediator;
    public SuperAdminPortalController(IMediator mediator) => _mediator = mediator;

    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct)
        => Ok(await _mediator.Send(new GetMySuperAdminProfileQuery(), ct));

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateMySuperAdminProfileCommand command, CancellationToken ct)
    {
        await _mediator.Send(command, ct);
        return NoContent();
    }

    [HttpPut("me/password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangeMySuperAdminPasswordCommand command, CancellationToken ct)
    {
        await _mediator.Send(command, ct);
        return NoContent();
    }
}