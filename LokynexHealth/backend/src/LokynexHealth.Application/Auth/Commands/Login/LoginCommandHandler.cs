using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Auth.Commands.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _tokenGenerator;

    public LoginCommandHandler(
        IApplicationDbContext db,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator tokenGenerator)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<LoginResult> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _db.Users
            .Include(u => u.Role)
            .Include(u => u.Permissions)
                .ThenInclude(p => p.Module)
            .FirstOrDefaultAsync(u => u.Username == request.Username, cancellationToken);

        // Same generic exception for "not found" AND "wrong password"
        if (user is null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            throw new UnauthorizedException("Invalid username or password.");

        if (user.Status != Domain.Enums.RecordStatus.Active)
            throw new UnauthorizedException("This account is inactive. Contact your Lab Admin.");

        var roleName = user.Role?.Name ?? "User";

        // Build a flat permission-string list like "NewOrder:View", "NewOrder:Create"
        var permissions = user.Permissions
            .SelectMany(p => BuildPermissionStrings(p))
            .ToList();

        // Use the token generator that now returns TokenResult (token + expiry)
        TokenResult tokenResult = _tokenGenerator.GenerateToken(user, roleName, permissions);

        return new LoginResult
        {
            Token = tokenResult.Token,
            UserId = user.Id,
            Name = user.Name,
            Role = roleName,
            ExpiresAt = tokenResult.ExpiresAt
        };
    }

    private static IEnumerable<string> BuildPermissionStrings(Domain.Entities.UserModulePermission p)
    {
        var moduleName = p.Module.Name;
        if (p.CanView) yield return $"{moduleName}:View";
        if (p.CanCreate) yield return $"{moduleName}:Create";
        if (p.CanEdit) yield return $"{moduleName}:Edit";
        if (p.CanDelete) yield return $"{moduleName}:Delete";
    }
}
