using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using LokynexHealth.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace LokynexHealth.Infrastructure.Security;

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly IConfiguration _configuration;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public TokenResult GenerateToken(User user, string roleName, List<string> permissions)
    {
        var secret = _configuration["Jwt:Secret"];
        var issuer = _configuration["Jwt:Issuer"];
        var audience = _configuration["Jwt:Audience"];

        if (string.IsNullOrWhiteSpace(secret))
            throw new InvalidOperationException("Missing configuration: Jwt:Secret");

        if (string.IsNullOrWhiteSpace(issuer))
            throw new InvalidOperationException("Missing configuration: Jwt:Issuer");

        if (string.IsNullOrWhiteSpace(audience))
            throw new InvalidOperationException("Missing configuration: Jwt:Audience");

        var expiryConfigured = _configuration["Jwt:ExpiryMinutes"];
        if (!int.TryParse(expiryConfigured, out var expiryMinutes))
        {
            expiryMinutes = 60; // default
        }

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Role, roleName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        claims.Add(new Claim("permissions", string.Join(",", permissions)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return new TokenResult(tokenString, expiresAt);
    }
}
