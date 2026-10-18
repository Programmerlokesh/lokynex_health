using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Auth.Commands.OwnerLogin;

public class OwnerLoginCommand : IRequest<OwnerLoginResult>
{
    public string Username { get; set; } = default!;
    public string Password { get; set; } = default!;
}

public class OwnerLoginResult
{
    public string Token { get; set; } = default!;
    public Guid OwnerId { get; set; }
    public string Name { get; set; } = default!;
    public string Role { get; set; } = default!;
    public DateTime ExpiresAt { get; set; }
}

public class OwnerLoginCommandHandler : IRequestHandler<OwnerLoginCommand, OwnerLoginResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenGenerator _tokens;

    public OwnerLoginCommandHandler(IApplicationDbContext db, IPasswordHasher hasher, IJwtTokenGenerator tokens)
    {
        _db = db;
        _hasher = hasher;
        _tokens = tokens;
    }

    public async Task<OwnerLoginResult> Handle(OwnerLoginCommand r, CancellationToken ct)
    {
        var owner = await _db.Owners.AsNoTracking().FirstOrDefaultAsync(o => o.Username == r.Username, ct);

        // Same generic message for "unknown user" and "wrong password".
        if (owner is null || !_hasher.VerifyPassword(r.Password, owner.PasswordHash))
            throw new UnauthorizedException("Invalid username or password.");

        if (owner.Status != PlatformRecordStatus.Active)
            throw new UnauthorizedException("This owner account is deactivated. Contact the SuperAdmin.");

        return new OwnerLoginResult
        {
            Token = _tokens.GenerateOwnerToken(owner.Id, owner.Username, owner.Name, owner.Role),
            OwnerId = owner.Id,
            Name = owner.Name,
            Role = owner.Role,
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        };
    }
}