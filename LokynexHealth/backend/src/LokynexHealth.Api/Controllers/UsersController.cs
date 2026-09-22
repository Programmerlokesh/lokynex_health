using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Users.Commands.CreateUser;
using LokynexHealth.Application.Users.Commands.DeleteUser;
using LokynexHealth.Application.Users.Commands.ResetUserPassword;
using LokynexHealth.Application.Users.Commands.ToggleUserStatus;
using LokynexHealth.Application.Users.Commands.UpdateOwnProfile;
using LokynexHealth.Application.Users.Commands.UpdateUser;
using LokynexHealth.Application.Users.Queries.GetMyProfile;
using LokynexHealth.Application.Users.Queries.GetUsers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public UsersController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    // ---------- LabAdmin-only account management ----------
    // Every write here (create, edit-any-user, reset-password, delete,
    // activate/deactivate) is restricted to LabAdmin. A plain lab user can
    // still call GetUsers (read-only directory) and the /me endpoints below.

    [HttpPost]
    [Authorize(Roles = "LabAdmin")]
    public async Task<IActionResult> CreateUser(
        [FromBody] CreateUserCommand command,
        CancellationToken cancellationToken)
    {
        var userId = await _mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(CreateUser), new { id = userId }, new { id = userId });
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new GetUsersQuery
        {
            Search = search,
            Status = status,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        var result = await _mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "LabAdmin")]
    public async Task<IActionResult> UpdateUser(
        Guid id,
        [FromBody] UpdateUserCommand command,
        CancellationToken cancellationToken)
    {
        command.Id = id;
        command.UpdatedBy = _currentUser.UserId;
        await _mediator.Send(command, cancellationToken);
        return NoContent();
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "LabAdmin")]
    public async Task<IActionResult> ToggleStatus(
        Guid id,
        [FromBody] ToggleUserStatusCommand command,
        CancellationToken cancellationToken)
    {
        command.Id = id;
        command.UpdatedBy = _currentUser.UserId;
        await _mediator.Send(command, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "LabAdmin")]
    public async Task<IActionResult> DeleteUser(Guid id, CancellationToken cancellationToken)
    {
        await _mediator.Send(
            new DeleteUserCommand { Id = id, PerformedBy = _currentUser.UserId },
            cancellationToken);
        return NoContent();
    }

    // Only a LabAdmin can set a NEW password for someone — there is no
    // self-service "change my password" anywhere in this API.
    [HttpPost("{id}/reset-password")]
    [Authorize(Roles = "LabAdmin")]
    public async Task<IActionResult> ResetPassword(
        Guid id,
        [FromBody] ResetUserPasswordCommand command,
        CancellationToken cancellationToken)
    {
        command.TargetUserId = id;
        command.PerformedBy = _currentUser.UserId;
        await _mediator.Send(command, cancellationToken);
        return NoContent();
    }

    // ---------- Self-service (any logged-in lab user, any role) ----------

    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile(CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is null)
            return Unauthorized();

        var result = await _mediator.Send(
            new GetMyProfileQuery { UserId = _currentUser.UserId.Value },
            cancellationToken);
        return Ok(result);
    }

    // Profile fields only (name/email/phone/address/pincode/photo) — never
    // password, role, branch or status. See UpdateOwnProfileCommand.
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile(
        [FromBody] UpdateOwnProfileCommand command,
        CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is null)
            return Unauthorized();

        command.UserId = _currentUser.UserId.Value;
        await _mediator.Send(command, cancellationToken);
        return NoContent();
    }
}