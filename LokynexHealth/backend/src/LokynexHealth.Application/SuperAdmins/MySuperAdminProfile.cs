using FluentValidation;
using FluentValidation.Results;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.SuperAdmins;

// The SuperAdmin's own profile (GET/PUT /api/superadmin/me, PUT /api/superadmin/me/password).
// The super_admins table only has name / email / username / password, so that is all
// the profile holds. Raw SQL is used (same as SuperAdminLogin) so the Postgres
// `record_status` enum column is never materialised through EF.

public class MySuperAdminProfileDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string Username { get; set; } = default!;
}

internal class SuperAdminProfileRow
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string Username { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public string Status { get; set; } = default!;
}

internal class SuperAdminIdRow
{
    public Guid Id { get; set; }
}

internal static class SuperAdminAccess
{
    // 401 here signs the SuperAdmin out (deleted / deactivated account).
    public static async Task<SuperAdminProfileRow> RequireActiveAsync(
        IApplicationDbContext db, ICurrentUserService user, CancellationToken ct)
    {
        if (user.TokenType != "SuperAdmin" || user.UserId is null)
            throw new UnauthorizedException("SuperAdmin access required.");

        var id = user.UserId.Value;
        var row = await db.Database
            .SqlQuery<SuperAdminProfileRow>($@"
                SELECT id, name, email::text AS email, username,
                       password_hash, status::text AS status
                FROM platform.super_admins
                WHERE id = {id}")
            .FirstOrDefaultAsync(ct);

        if (row is null || row.Status != "Active")
            throw new UnauthorizedException("This SuperAdmin account is not available.");

        return row;
    }
}

// ---------- GET /api/superadmin/me ----------
public class GetMySuperAdminProfileQuery : IRequest<MySuperAdminProfileDto> { }

public class GetMySuperAdminProfileQueryHandler
    : IRequestHandler<GetMySuperAdminProfileQuery, MySuperAdminProfileDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;

    public GetMySuperAdminProfileQueryHandler(IApplicationDbContext db, ICurrentUserService user)
    {
        _db = db;
        _user = user;
    }

    public async Task<MySuperAdminProfileDto> Handle(GetMySuperAdminProfileQuery request, CancellationToken ct)
    {
        var me = await SuperAdminAccess.RequireActiveAsync(_db, _user, ct);
        return new MySuperAdminProfileDto
        {
            Id = me.Id,
            Name = me.Name,
            Email = me.Email,
            Username = me.Username,
        };
    }
}

// ---------- PUT /api/superadmin/me ----------
public class UpdateMySuperAdminProfileCommand : IRequest
{
    public string Name { get; set; } = default!;
    public string Email { get; set; } = default!;
}

public class UpdateMySuperAdminProfileCommandValidator : AbstractValidator<UpdateMySuperAdminProfileCommand>
{
    public UpdateMySuperAdminProfileCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(254);
    }
}

public class UpdateMySuperAdminProfileCommandHandler : IRequestHandler<UpdateMySuperAdminProfileCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;

    public UpdateMySuperAdminProfileCommandHandler(IApplicationDbContext db, ICurrentUserService user)
    {
        _db = db;
        _user = user;
    }

    public async Task Handle(UpdateMySuperAdminProfileCommand r, CancellationToken ct)
    {
        var me = await SuperAdminAccess.RequireActiveAsync(_db, _user, ct);
        var name = r.Name.Trim();
        var email = r.Email.Trim();
        var id = me.Id;

        var taken = await _db.Database
            .SqlQuery<SuperAdminIdRow>($@"
                SELECT id FROM platform.super_admins
                WHERE lower(email::text) = lower({email}) AND id <> {id}")
            .AnyAsync(ct);
        if (taken)
        {
            throw new ValidationException(new[]
            {
                new ValidationFailure(nameof(r.Email), "This email is already in use.")
            });
        }

        await _db.Database.ExecuteSqlInterpolatedAsync($@"
            UPDATE platform.super_admins
            SET name = {name}, email = {email}, updated_at = now()
            WHERE id = {id}", ct);
    }
}

// ---------- PUT /api/superadmin/me/password ----------
public class ChangeMySuperAdminPasswordCommand : IRequest
{
    public string CurrentPassword { get; set; } = default!;
    public string NewPassword { get; set; } = default!;
}

public class ChangeMySuperAdminPasswordCommandValidator : AbstractValidator<ChangeMySuperAdminPasswordCommand>
{
    public ChangeMySuperAdminPasswordCommandValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty();
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(8);
    }
}

public class ChangeMySuperAdminPasswordCommandHandler : IRequestHandler<ChangeMySuperAdminPasswordCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    private readonly IPasswordHasher _hasher;

    public ChangeMySuperAdminPasswordCommandHandler(
        IApplicationDbContext db, ICurrentUserService user, IPasswordHasher hasher)
    {
        _db = db;
        _user = user;
        _hasher = hasher;
    }

    public async Task Handle(ChangeMySuperAdminPasswordCommand r, CancellationToken ct)
    {
        var me = await SuperAdminAccess.RequireActiveAsync(_db, _user, ct);

        // 400 (not 401) so a typo here doesn't log the SuperAdmin out.
        if (!_hasher.VerifyPassword(r.CurrentPassword, me.PasswordHash))
        {
            throw new ValidationException(new[]
            {
                new ValidationFailure(nameof(r.CurrentPassword), "Current password is incorrect.")
            });
        }

        var hash = _hasher.HashPassword(r.NewPassword);
        var id = me.Id;
        await _db.Database.ExecuteSqlInterpolatedAsync($@"
            UPDATE platform.super_admins
            SET password_hash = {hash}, updated_at = now()
            WHERE id = {id}", ct);
    }
}