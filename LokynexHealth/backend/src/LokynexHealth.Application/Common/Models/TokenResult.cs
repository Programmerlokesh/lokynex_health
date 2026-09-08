using LokynexHealth.Domain.Entities;

namespace LokynexHealth.Application.Common.Models;

public class TokenResult
{
    public string Token { get; set; } = default!;
    public DateTime ExpiresAt { get; set; }

    public TokenResult(string token, DateTime expiresAt)
    {
        Token = token;
        ExpiresAt = expiresAt;
    }
}
