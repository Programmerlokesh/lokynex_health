namespace LokynexHealth.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Username { get; }
    string? Role { get; }
    List<string> Permissions { get; }
    bool IsAuthenticated { get; }
}