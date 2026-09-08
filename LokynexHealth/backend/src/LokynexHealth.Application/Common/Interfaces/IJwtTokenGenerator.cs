using LokynexHealth.Domain.Entities;

namespace LokynexHealth.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    LokynexHealth.Application.Common.Models.TokenResult GenerateToken(User user, string roleName, List<string> permissions);
}
