using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Auth.Commands.SuperAdminLogin;

// A raw-SQL projection row — Status is cast to text server-side (status::text)
// instead of being read through EF's normal enum materialization. Column aliases
// here are kept plain lowercase/snake_case (id, name, username, password_hash,
// status) to match the DbContext's global snake_case naming convention — EF
// wraps SqlQuery<T> results in a query that expects exactly that naming when
// mapping back to SuperAdminAuthRow's properties (Id, Name, Username,
// PasswordHash, Status). A quoted PascalCase alias like AS "Id" breaks that
// match ("column l.id does not exist") since the convention generates lowercase,
// unquoted names, not PascalCase quoted ones.
internal class SuperAdminAuthRow
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string Username { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public string Status { get; set; } = default!;
}

public class SuperAdminLoginCommandHandler : IRequestHandler<SuperAdminLoginCommand, SuperAdminLoginResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _tokenGenerator;

    public SuperAdminLoginCommandHandler(
        IApplicationDbContext db,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator tokenGenerator)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<SuperAdminLoginResult> Handle(SuperAdminLoginCommand request, CancellationToken cancellationToken)
    {
        var admin = await _db.Database
            .SqlQuery<SuperAdminAuthRow>($@"
                SELECT id, name, username, password_hash, status::text AS status
                FROM platform.super_admins
                WHERE username = {request.Username}")
            .FirstOrDefaultAsync(cancellationToken);

        // Same generic exception for "not found" AND "wrong password" — avoids
        // leaking which one failed, same rule the tenant login already follows.
        if (admin is null || !_passwordHasher.VerifyPassword(request.Password, admin.PasswordHash))
            throw new UnauthorizedException("Invalid username or password.");

        if (admin.Status != "Active")
            throw new UnauthorizedException("This SuperAdmin account is inactive.");

        var token = _tokenGenerator.GenerateSuperAdminToken(admin.Id, admin.Username);

        return new SuperAdminLoginResult
        {
            Token = token,
            SuperAdminId = admin.Id,
            Name = admin.Name,
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        };
    }
}