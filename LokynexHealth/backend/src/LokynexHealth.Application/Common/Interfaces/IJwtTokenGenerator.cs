using LokynexHealth.Domain.Entities;

namespace LokynexHealth.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user, string roleName, List<string> permissions);
}