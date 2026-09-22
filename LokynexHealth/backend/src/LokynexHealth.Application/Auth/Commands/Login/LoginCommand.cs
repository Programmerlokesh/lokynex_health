using MediatR;

namespace LokynexHealth.Application.Auth.Commands.Login;

public class LoginCommand : IRequest<LoginResult>
{
    public string Username { get; set; } = default!;
    public string Password { get; set; } = default!;
}

public class LoginResult
{
    public string Token { get; set; } = default!;
    public Guid UserId { get; set; }
    public string Name { get; set; } = default!;
    public string Role { get; set; } = default!;
    // This tenant deployment's own lab name (platform.tenants.primary_branch_name),
    // resolved via current_schema() — shown in the Topbar so a lab's own staff see
    // THEIR lab's name, not a generic "Lokynex Health" label.
    public string? LabName { get; set; }
    public DateTime ExpiresAt { get; set; }
}