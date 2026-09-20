using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
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

        // Same generic exception for "not found" AND "wrong password" — see rule above.
        if (user is null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            throw new UnauthorizedException("Invalid username or password.");

        if (user.Status != Domain.Enums.RecordStatus.Active)
            throw new UnauthorizedException("This account is inactive. Contact your Lab Admin.");

        var roleName = user.Role?.Name ?? "User";

        // The platform "SuperAdmin" role only exists in platform.super_admins and
        // is issued ONLY by the SuperAdmin login. A lab-side user that somehow
        // carries a role called "SuperAdmin" must not get a token for it.
        if (string.Equals(roleName, "SuperAdmin", StringComparison.OrdinalIgnoreCase))
            throw new UnauthorizedException("Invalid username or password.");

        // Build a flat permission-string list like "NewOrder:View", "NewOrder:Create" —
        // consumed as O(1) HashSet-style checks later by a permission-based authorize filter.
        var permissions = user.Permissions
            .SelectMany(p => BuildPermissionStrings(p))
            .ToList();

        var token = _tokenGenerator.GenerateToken(user, roleName, permissions);

        return new LoginResult
        {
            Token = token,
            UserId = user.Id,
            Name = user.Name,
            Role = roleName,
            ExpiresAt = DateTime.UtcNow.AddHours(1)
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