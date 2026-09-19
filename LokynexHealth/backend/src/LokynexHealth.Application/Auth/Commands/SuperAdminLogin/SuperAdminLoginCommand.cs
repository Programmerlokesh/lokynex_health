using MediatR;

namespace LokynexHealth.Application.Auth.Commands.SuperAdminLogin;

public class SuperAdminLoginCommand : IRequest<SuperAdminLoginResult>
{
    public string Username { get; set; } = default!;
    public string Password { get; set; } = default!;
}

public class SuperAdminLoginResult
{
    public string Token { get; set; } = default!;
    public Guid SuperAdminId { get; set; }
    public string Name { get; set; } = default!;
    public DateTime ExpiresAt { get; set; }
}