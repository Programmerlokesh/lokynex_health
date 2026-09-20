using MediatR;

namespace LokynexHealth.Application.Auth.Commands.UnifiedLogin;

// The single sign-in used by the ONE login page. The server decides whether
// the credentials belong to a lab user or to the platform SuperAdmin.
public class UnifiedLoginCommand : IRequest<UnifiedLoginResult>
{
    public string Username { get; set; } = default!;
    public string Password { get; set; } = default!;
}

public class UnifiedLoginResult
{
    // "Lab" or "SuperAdmin" — tells the frontend which dashboard to open.
    public string AccountType { get; set; } = default!;
    public string Token { get; set; } = default!;
    public Guid UserId { get; set; }
    public string Name { get; set; } = default!;
    public string Role { get; set; } = default!;
    public DateTime ExpiresAt { get; set; }
}