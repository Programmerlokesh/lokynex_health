using MediatR;

namespace LokynexHealth.Application.Auth.Commands.TenantAdminLogin;

public class TenantAdminLoginCommand : IRequest<TenantAdminLoginResult>
{
    public string Username { get; set; } = default!;
    public string Password { get; set; } = default!;
}

public class TenantAdminLoginResult
{
    public string Token { get; set; } = default!;
    public Guid TenantId { get; set; }
    public string Name { get; set; } = default!;
    public string SchemaName { get; set; } = default!;
    public string LabCode { get; set; } = default!;
    public DateTime ExpiresAt { get; set; }
}