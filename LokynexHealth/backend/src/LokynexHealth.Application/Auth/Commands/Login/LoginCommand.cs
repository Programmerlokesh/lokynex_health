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
    public DateTime ExpiresAt { get; set; }
}