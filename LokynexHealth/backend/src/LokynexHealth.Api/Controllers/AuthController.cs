using LokynexHealth.Application.Auth.Commands.Login;
using LokynexHealth.Application.Auth.Commands.SuperAdminLogin;
using LokynexHealth.Application.Auth.Commands.UnifiedLogin;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return Ok(result);
    }

    // THE endpoint the single login page uses. The server works out whether the
    // credentials are a lab user or the platform SuperAdmin and returns
    // AccountType = "Lab" | "SuperAdmin" so the frontend can route accordingly.
    [AllowAnonymous]
    [HttpPost("sign-in")]
    public async Task<IActionResult> UnifiedLogin([FromBody] UnifiedLoginCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return Ok(result);
    }

    // Completely separate from the tenant-user login above — checks the
    // platform-schema SuperAdmins table, not the tenant Users table. This is
    // the ONLY way to obtain a token with Role = "SuperAdmin".
    [AllowAnonymous]
    [HttpPost("superadmin-login")]
    public async Task<IActionResult> SuperAdminLogin([FromBody] SuperAdminLoginCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return Ok(result);
    }
}