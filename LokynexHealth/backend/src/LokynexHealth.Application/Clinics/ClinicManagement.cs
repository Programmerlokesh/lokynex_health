using FluentValidation;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Clinics;

/// <summary>One login box serves every account type, so a username must be unique across ALL of them.</summary>
public static class ClinicUsernames
{
    public static async Task<bool> IsTakenAsync(IApplicationDbContext db, string username, CancellationToken ct) =>
        await db.Clinics.AnyAsync(x => x.AdminUsername == username, ct)
        || await db.ClinicUsers.AnyAsync(x => x.Username == username, ct)
        || await db.Tenants.AnyAsync(x => x.AdminUsername == username, ct)
        || await db.Owners.AnyAsync(x => x.Username == username, ct)
        || await db.SuperAdmins.AnyAsync(x => x.Username == username, ct)
        || await db.Users.AnyAsync(x => x.Username == username, ct);
}

// =====================================================================
//  SUPERADMIN SIDE — create / list / edit clinics (mirrors "Create Lab")
// =====================================================================
public class ClinicDto
{
    public Guid Id { get; set; }
    public string ClinicCode { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string AdminName { get; set; } = default!;
    public string AdminUsername { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public int UserLimit { get; set; }
    public int UserCount { get; set; }
    public string Status { get; set; } = default!;
    public string? CreatedByName { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public class ClinicDetailDto : ClinicDto
{
    public string? Tagline { get; set; }
    public string Address { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string Pincode { get; set; } = default!;
    public string? RegistrationNo { get; set; }
    public string AdminPhone { get; set; } = default!;
    public string? AdminAddress { get; set; }
    public string AdminEmail { get; set; } = default!;
}

public class CreateClinicCommand : IRequest<Guid>
{
    public string ClinicName { get; set; } = default!;
    public string? Tagline { get; set; }
    public string Address { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string Pincode { get; set; } = default!;
    public string? RegistrationNo { get; set; }

    public string AdminName { get; set; } = default!;
    public string AdminPhone { get; set; } = default!;
    public string? AdminAddress { get; set; }
    public string AdminEmail { get; set; } = default!;
    public string AdminUsername { get; set; } = default!;
    public string AdminPassword { get; set; } = default!;
    public int UserLimit { get; set; } = 5;

    // The admin is the clinic's first doctor (printed on prescriptions).
    public string? DoctorQualification { get; set; }
    public string? DoctorSpecialization { get; set; }
    public string? DoctorRegistrationNo { get; set; }
}

public class CreateClinicCommandValidator : AbstractValidator<CreateClinicCommand>
{
    public CreateClinicCommandValidator()
    {
        RuleFor(x => x.ClinicName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Address).NotEmpty();
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Pincode).NotEmpty().MaximumLength(10);
        RuleFor(x => x.AdminName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.AdminPhone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.AdminEmail).NotEmpty().EmailAddress();
        RuleFor(x => x.AdminUsername).NotEmpty().MaximumLength(100);
        RuleFor(x => x.AdminPassword).NotEmpty().MinimumLength(8);
        RuleFor(x => x.UserLimit).InclusiveBetween(1, 500);
        RuleFor(x => x.DoctorQualification).MaximumLength(200);
        RuleFor(x => x.DoctorSpecialization).MaximumLength(150);
        RuleFor(x => x.DoctorRegistrationNo).MaximumLength(60);
    }
}

public class CreateClinicCommandHandler : IRequestHandler<CreateClinicCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly ICurrentUserService _user;
    public CreateClinicCommandHandler(IApplicationDbContext db, IPasswordHasher hasher, ICurrentUserService user)
    { _db = db; _hasher = hasher; _user = user; }

    public async Task<Guid> Handle(CreateClinicCommand r, CancellationToken ct)
    {
        var username = r.AdminUsername.Trim();
        if (await ClinicUsernames.IsTakenAsync(_db, username, ct))
            throw new ConflictException($"Username '{username}' is already in use.");

        string code = "";
        for (var i = 0; i < 10; i++)
        {
            code = "CL" + Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();
            if (!await _db.Clinics.AnyAsync(c => c.ClinicCode == code, ct)) break;
            if (i == 9) throw new InvalidOperationException("Could not generate a unique clinic code.");
        }

        string? creatorName = null;
        if (_user.UserId is { } sid)
            creatorName = await _db.SuperAdmins.Where(s => s.Id == sid).Select(s => s.Name).FirstOrDefaultAsync(ct);

        var now = DateTimeOffset.UtcNow;
        var clinic = new Clinic
        {
            Id = Guid.NewGuid(),
            ClinicCode = code,
            Name = r.ClinicName.Trim(),
            Tagline = ClinicScope.Clean(r.Tagline),
            Address = r.Address.Trim(),
            Phone = r.Phone.Trim(),
            Email = r.Email.Trim(),
            Pincode = r.Pincode.Trim(),
            RegistrationNo = ClinicScope.Clean(r.RegistrationNo),
            AdminName = r.AdminName.Trim(),
            AdminPhone = r.AdminPhone.Trim(),
            AdminAddress = ClinicScope.Clean(r.AdminAddress),
            AdminEmail = r.AdminEmail.Trim(),
            AdminUsername = username,
            AdminPasswordHash = _hasher.HashPassword(r.AdminPassword),
            UserLimit = r.UserLimit,
            Status = ClinicStatus.Active,
            CreatedBy = _user.UserId,
            CreatedByName = creatorName ?? "SuperAdmin",
            CreatedAt = now
        };
        _db.Clinics.Add(clinic);

        _db.ClinicDoctors.Add(new ClinicDoctor
        {
            Id = Guid.NewGuid(),
            ClinicId = clinic.Id,
            FullName = clinic.AdminName,
            Qualification = ClinicScope.Clean(r.DoctorQualification),
            Specialization = ClinicScope.Clean(r.DoctorSpecialization),
            RegistrationNo = ClinicScope.Clean(r.DoctorRegistrationNo),
            Phone = clinic.AdminPhone,
            Email = clinic.AdminEmail,
            Status = ClinicStatus.Active,
            CreatedAt = now
        });

        await _db.SaveChangesAsync(ct);
        return clinic.Id;
    }
}

public class GetClinicsQuery : IRequest<PagedResult<ClinicDto>>
{
    public string? Search { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

public class GetClinicsQueryHandler : IRequestHandler<GetClinicsQuery, PagedResult<ClinicDto>>
{
    private readonly IApplicationDbContext _db;
    public GetClinicsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<PagedResult<ClinicDto>> Handle(GetClinicsQuery r, CancellationToken ct)
    {
        var page = Math.Max(r.PageNumber, 1);
        var size = Math.Clamp(r.PageSize, 1, 200);
        var q = _db.Clinics.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(r.Search))
        {
            var like = $"%{ClinicScope.Escape(r.Search)}%";
            q = q.Where(c => EF.Functions.ILike(c.Name, like) || EF.Functions.ILike(c.ClinicCode, like)
                          || EF.Functions.ILike(c.AdminName, like));
        }

        var total = await q.CountAsync(ct);
        var rows = await q.OrderByDescending(c => c.CreatedAt).Skip((page - 1) * size).Take(size).ToListAsync(ct);

        // ONE grouped query for the user counts of the whole page (no N+1).
        var ids = rows.Select(c => c.Id).ToList();
        var counts = await _db.ClinicUsers.AsNoTracking().Where(u => ids.Contains(u.ClinicId))
            .GroupBy(u => u.ClinicId).Select(g => new { g.Key, N = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.N, ct);

        return new PagedResult<ClinicDto>
        {
            Items = rows.Select(c => new ClinicDto
            {
                Id = c.Id,
                ClinicCode = c.ClinicCode,
                Name = c.Name,
                AdminName = c.AdminName,
                AdminUsername = c.AdminUsername,
                Phone = c.Phone,
                UserLimit = c.UserLimit,
                UserCount = counts.GetValueOrDefault(c.Id),
                Status = c.Status,
                CreatedByName = c.CreatedByName,
                CreatedAt = c.CreatedAt
            }).ToList(),
            TotalCount = total,
            PageNumber = page,
            PageSize = size
        };
    }
}

public class GetClinicByIdQuery : IRequest<ClinicDetailDto> { public Guid Id { get; set; } }

public class GetClinicByIdQueryHandler : IRequestHandler<GetClinicByIdQuery, ClinicDetailDto>
{
    private readonly IApplicationDbContext _db;
    public GetClinicByIdQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<ClinicDetailDto> Handle(GetClinicByIdQuery r, CancellationToken ct)
    {
        var c = await _db.Clinics.AsNoTracking().FirstOrDefaultAsync(x => x.Id == r.Id, ct)
                ?? throw new NotFoundException("Clinic", r.Id);
        var n = await _db.ClinicUsers.CountAsync(u => u.ClinicId == r.Id, ct);
        return new ClinicDetailDto
        {
            Id = c.Id,
            ClinicCode = c.ClinicCode,
            Name = c.Name,
            AdminName = c.AdminName,
            AdminUsername = c.AdminUsername,
            Phone = c.Phone,
            UserLimit = c.UserLimit,
            UserCount = n,
            Status = c.Status,
            CreatedByName = c.CreatedByName,
            CreatedAt = c.CreatedAt,
            Tagline = c.Tagline,
            Address = c.Address,
            Email = c.Email,
            Pincode = c.Pincode,
            RegistrationNo = c.RegistrationNo,
            AdminPhone = c.AdminPhone,
            AdminAddress = c.AdminAddress,
            AdminEmail = c.AdminEmail
        };
    }
}

public class UpdateClinicCommand : IRequest
{
    public Guid Id { get; set; }
    public string ClinicName { get; set; } = default!;
    public string? Tagline { get; set; }
    public string Address { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string Pincode { get; set; } = default!;
    public string? RegistrationNo { get; set; }
    public string AdminName { get; set; } = default!;
    public string AdminPhone { get; set; } = default!;
    public string? AdminAddress { get; set; }
    public string AdminEmail { get; set; } = default!;
    public int UserLimit { get; set; }
    public string Status { get; set; } = ClinicStatus.Active;
}

public class UpdateClinicCommandValidator : AbstractValidator<UpdateClinicCommand>
{
    public UpdateClinicCommandValidator()
    {
        RuleFor(x => x.ClinicName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Address).NotEmpty();
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Pincode).NotEmpty().MaximumLength(10);
        RuleFor(x => x.AdminName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.AdminPhone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.AdminEmail).NotEmpty().EmailAddress();
        RuleFor(x => x.UserLimit).InclusiveBetween(1, 500);
        RuleFor(x => x.Status).Must(s => s is ClinicStatus.Active or ClinicStatus.Inactive or ClinicStatus.Suspended)
            .WithMessage("Status must be Active, Inactive or Suspended.");
    }
}

public class UpdateClinicCommandHandler : IRequestHandler<UpdateClinicCommand>
{
    private readonly IApplicationDbContext _db;
    public UpdateClinicCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task Handle(UpdateClinicCommand r, CancellationToken ct)
    {
        var c = await _db.Clinics.FirstOrDefaultAsync(x => x.Id == r.Id, ct) ?? throw new NotFoundException("Clinic", r.Id);
        c.Name = r.ClinicName.Trim();
        c.Tagline = ClinicScope.Clean(r.Tagline);
        c.Address = r.Address.Trim();
        c.Phone = r.Phone.Trim();
        c.Email = r.Email.Trim();
        c.Pincode = r.Pincode.Trim();
        c.RegistrationNo = ClinicScope.Clean(r.RegistrationNo);
        c.AdminName = r.AdminName.Trim();
        c.AdminPhone = r.AdminPhone.Trim();
        c.AdminAddress = ClinicScope.Clean(r.AdminAddress);
        c.AdminEmail = r.AdminEmail.Trim();
        c.UserLimit = r.UserLimit;
        c.Status = r.Status;
        c.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}

public class ResetClinicAdminPasswordCommand : IRequest
{
    public Guid Id { get; set; }
    public string NewPassword { get; set; } = default!;
}

public class ResetClinicAdminPasswordCommandValidator : AbstractValidator<ResetClinicAdminPasswordCommand>
{
    public ResetClinicAdminPasswordCommandValidator() => RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(8);
}

public class ResetClinicAdminPasswordCommandHandler : IRequestHandler<ResetClinicAdminPasswordCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _hasher;
    public ResetClinicAdminPasswordCommandHandler(IApplicationDbContext db, IPasswordHasher hasher) { _db = db; _hasher = hasher; }

    public async Task Handle(ResetClinicAdminPasswordCommand r, CancellationToken ct)
    {
        var c = await _db.Clinics.FirstOrDefaultAsync(x => x.Id == r.Id, ct) ?? throw new NotFoundException("Clinic", r.Id);
        c.AdminPasswordHash = _hasher.HashPassword(r.NewPassword);
        await _db.SaveChangesAsync(ct);
    }
}

// =====================================================================
//  CLINIC USERS — the clinic admin decides who gets which role
// =====================================================================
public class ClinicUserDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string Username { get; set; } = default!;
    public string? Email { get; set; }
    public string Phone { get; set; } = default!;
    public string Role { get; set; } = default!;
    public List<string> Permissions { get; set; } = new();
    public string Status { get; set; } = default!;
    public DateTimeOffset CreatedAt { get; set; }
}

public class ClinicRolesMetaDto
{
    public List<string> Modules { get; set; } = new();
    public Dictionary<string, string> ModuleLabels { get; set; } = new();
    public List<string> Actions { get; set; } = new();
    public Dictionary<string, List<string>> RolePresets { get; set; } = new();
}

public class GetClinicRolesMetaQuery : IRequest<ClinicRolesMetaDto> { }

public class GetClinicRolesMetaQueryHandler : IRequestHandler<GetClinicRolesMetaQuery, ClinicRolesMetaDto>
{
    public Task<ClinicRolesMetaDto> Handle(GetClinicRolesMetaQuery r, CancellationToken ct) =>
        Task.FromResult(new ClinicRolesMetaDto
        {
            Modules = ClinicPermissions.Modules.ToList(),
            ModuleLabels = new(ClinicPermissions.ModuleLabels),
            Actions = ClinicPermissions.Actions.ToList(),
            RolePresets = ClinicPermissions.RolePresets.ToDictionary(k => k.Key, k => k.Value.ToList())
        });
}

public class GetClinicUsersQuery : IRequest<PagedResult<ClinicUserDto>>
{
    public string? Search { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

public class GetClinicUsersQueryHandler : IRequestHandler<GetClinicUsersQuery, PagedResult<ClinicUserDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public GetClinicUsersQueryHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task<PagedResult<ClinicUserDto>> Handle(GetClinicUsersQuery r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var page = Math.Max(r.PageNumber, 1);
        var size = Math.Clamp(r.PageSize, 1, 200);
        var q = _db.ClinicUsers.AsNoTracking().Where(u => u.ClinicId == cid);
        if (!string.IsNullOrWhiteSpace(r.Search))
        {
            var like = $"%{ClinicScope.Escape(r.Search)}%";
            q = q.Where(u => EF.Functions.ILike(u.Name, like) || EF.Functions.ILike(u.Username, like)
                          || EF.Functions.ILike(u.Phone, like) || EF.Functions.ILike(u.Role, like));
        }
        var total = await q.CountAsync(ct);
        var rows = await q.OrderBy(u => u.Name).Skip((page - 1) * size).Take(size).ToListAsync(ct);
        return new PagedResult<ClinicUserDto>
        {
            Items = rows.Select(u => new ClinicUserDto
            {
                Id = u.Id,
                Name = u.Name,
                Username = u.Username,
                Email = u.Email,
                Phone = u.Phone,
                Role = u.Role,
                Permissions = ClinicPermissions.Parse(u.Permissions).ToList(),
                Status = u.Status,
                CreatedAt = u.CreatedAt
            }).ToList(),
            TotalCount = total,
            PageNumber = page,
            PageSize = size
        };
    }
}

public class CreateClinicUserCommand : IRequest<Guid>
{
    public string Name { get; set; } = default!;
    public string Username { get; set; } = default!;
    public string? Email { get; set; }
    public string Phone { get; set; } = default!;
    public string Role { get; set; } = default!;
    public List<string> Permissions { get; set; } = new();
    public string Password { get; set; } = default!;
}

public class CreateClinicUserCommandValidator : AbstractValidator<CreateClinicUserCommand>
{
    public CreateClinicUserCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Username).NotEmpty().MinimumLength(3).MaximumLength(100);
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Role).Must(ClinicPermissions.IsValidRole).WithMessage("Choose a valid role.");
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8);
    }
}

public class CreateClinicUserCommandHandler : IRequestHandler<CreateClinicUserCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    private readonly IPasswordHasher _hasher;
    public CreateClinicUserCommandHandler(IApplicationDbContext db, ICurrentUserService user, IPasswordHasher hasher)
    { _db = db; _user = user; _hasher = hasher; }

    public async Task<Guid> Handle(CreateClinicUserCommand r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var limit = await _db.Clinics.Where(c => c.Id == cid).Select(c => c.UserLimit).FirstAsync(ct);
        if (await _db.ClinicUsers.CountAsync(u => u.ClinicId == cid, ct) >= limit)
            throw new ConflictException($"User limit reached ({limit}). Ask the SuperAdmin to raise it.");

        var username = r.Username.Trim();
        if (await ClinicUsernames.IsTakenAsync(_db, username, ct))
            throw new ConflictException($"Username '{username}' is already in use.");

        var u = new ClinicUser
        {
            Id = Guid.NewGuid(),
            ClinicId = cid,
            Name = r.Name.Trim(),
            Username = username,
            Email = ClinicScope.Clean(r.Email),
            Phone = r.Phone.Trim(),
            Role = r.Role,
            Permissions = ClinicPermissions.Sanitize(r.Permissions),
            PasswordHash = _hasher.HashPassword(r.Password),
            Status = ClinicStatus.Active,
            CreatedBy = _user.UserId,
            CreatedAt = DateTimeOffset.UtcNow
        };
        _db.ClinicUsers.Add(u);
        await _db.SaveChangesAsync(ct);
        return u.Id;
    }
}

public class UpdateClinicUserCommand : IRequest
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string? Email { get; set; }
    public string Phone { get; set; } = default!;
    public string Role { get; set; } = default!;
    public List<string> Permissions { get; set; } = new();
}

public class UpdateClinicUserCommandValidator : AbstractValidator<UpdateClinicUserCommand>
{
    public UpdateClinicUserCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Role).Must(ClinicPermissions.IsValidRole).WithMessage("Choose a valid role.");
    }
}

public class UpdateClinicUserCommandHandler : IRequestHandler<UpdateClinicUserCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public UpdateClinicUserCommandHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task Handle(UpdateClinicUserCommand r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var u = await _db.ClinicUsers.FirstOrDefaultAsync(x => x.Id == r.Id && x.ClinicId == cid, ct)
                ?? throw new NotFoundException("User", r.Id);
        u.Name = r.Name.Trim();
        u.Email = ClinicScope.Clean(r.Email);
        u.Phone = r.Phone.Trim();
        u.Role = r.Role;
        u.Permissions = ClinicPermissions.Sanitize(r.Permissions);
        u.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}

public class SetClinicUserStatusCommand : IRequest
{
    public Guid Id { get; set; }
    public bool IsActive { get; set; }
}

public class SetClinicUserStatusCommandHandler : IRequestHandler<SetClinicUserStatusCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public SetClinicUserStatusCommandHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task Handle(SetClinicUserStatusCommand r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var u = await _db.ClinicUsers.FirstOrDefaultAsync(x => x.Id == r.Id && x.ClinicId == cid, ct)
                ?? throw new NotFoundException("User", r.Id);
        u.Status = r.IsActive ? ClinicStatus.Active : ClinicStatus.Inactive;
        u.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}

public class ResetClinicUserPasswordCommand : IRequest
{
    public Guid Id { get; set; }
    public string NewPassword { get; set; } = default!;
}

public class ResetClinicUserPasswordCommandValidator : AbstractValidator<ResetClinicUserPasswordCommand>
{
    public ResetClinicUserPasswordCommandValidator() => RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(8);
}

public class ResetClinicUserPasswordCommandHandler : IRequestHandler<ResetClinicUserPasswordCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    private readonly IPasswordHasher _hasher;
    public ResetClinicUserPasswordCommandHandler(IApplicationDbContext db, ICurrentUserService user, IPasswordHasher hasher)
    { _db = db; _user = user; _hasher = hasher; }

    public async Task Handle(ResetClinicUserPasswordCommand r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var u = await _db.ClinicUsers.FirstOrDefaultAsync(x => x.Id == r.Id && x.ClinicId == cid, ct)
                ?? throw new NotFoundException("User", r.Id);
        u.PasswordHash = _hasher.HashPassword(r.NewPassword);
        await _db.SaveChangesAsync(ct);
    }
}

public class DeleteClinicUserCommand : IRequest { public Guid Id { get; set; } }

public class DeleteClinicUserCommandHandler : IRequestHandler<DeleteClinicUserCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public DeleteClinicUserCommandHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task Handle(DeleteClinicUserCommand r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var u = await _db.ClinicUsers.FirstOrDefaultAsync(x => x.Id == r.Id && x.ClinicId == cid, ct)
                ?? throw new NotFoundException("User", r.Id);
        _db.ClinicUsers.Remove(u);
        await _db.SaveChangesAsync(ct);
    }
}

// =====================================================================
//  CLINIC DOCTORS
// =====================================================================
public class ClinicDoctorDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = default!;
    public string? Qualification { get; set; }
    public string? Specialization { get; set; }
    public string? RegistrationNo { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string Status { get; set; } = default!;
}

public class GetClinicDoctorsQuery : IRequest<List<ClinicDoctorDto>>
{
    public string? Search { get; set; }
    public bool ActiveOnly { get; set; }
}

public class GetClinicDoctorsQueryHandler : IRequestHandler<GetClinicDoctorsQuery, List<ClinicDoctorDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public GetClinicDoctorsQueryHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task<List<ClinicDoctorDto>> Handle(GetClinicDoctorsQuery r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var q = _db.ClinicDoctors.AsNoTracking().Where(d => d.ClinicId == cid);
        if (r.ActiveOnly) q = q.Where(d => d.Status == ClinicStatus.Active);
        if (!string.IsNullOrWhiteSpace(r.Search))
        {
            var like = $"%{ClinicScope.Escape(r.Search)}%";
            q = q.Where(d => EF.Functions.ILike(d.FullName, like) || EF.Functions.ILike(d.Specialization ?? "", like));
        }
        return await q.OrderBy(d => d.FullName).Select(d => new ClinicDoctorDto
        {
            Id = d.Id,
            FullName = d.FullName,
            Qualification = d.Qualification,
            Specialization = d.Specialization,
            RegistrationNo = d.RegistrationNo,
            Phone = d.Phone,
            Email = d.Email,
            Status = d.Status
        }).ToListAsync(ct);
    }
}

public class SaveClinicDoctorCommand : IRequest<Guid>
{
    /// <summary>Null = create, otherwise edit.</summary>
    public Guid? Id { get; set; }
    public string FullName { get; set; } = default!;
    public string? Qualification { get; set; }
    public string? Specialization { get; set; }
    public string? RegistrationNo { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string Status { get; set; } = ClinicStatus.Active;
}

public class SaveClinicDoctorCommandValidator : AbstractValidator<SaveClinicDoctorCommand>
{
    public SaveClinicDoctorCommandValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Qualification).MaximumLength(200);
        RuleFor(x => x.Specialization).MaximumLength(150);
        RuleFor(x => x.RegistrationNo).MaximumLength(60);
        RuleFor(x => x.Phone).MaximumLength(20);
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.Status).Must(s => s is ClinicStatus.Active or ClinicStatus.Inactive);
    }
}

public class SaveClinicDoctorCommandHandler : IRequestHandler<SaveClinicDoctorCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public SaveClinicDoctorCommandHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task<Guid> Handle(SaveClinicDoctorCommand r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        ClinicDoctor d;
        if (r.Id is { } id)
        {
            d = await _db.ClinicDoctors.FirstOrDefaultAsync(x => x.Id == id && x.ClinicId == cid, ct)
                ?? throw new NotFoundException("Doctor", id);
            d.UpdatedAt = DateTimeOffset.UtcNow;
        }
        else
        {
            d = new ClinicDoctor { Id = Guid.NewGuid(), ClinicId = cid, CreatedAt = DateTimeOffset.UtcNow };
            _db.ClinicDoctors.Add(d);
        }
        d.FullName = r.FullName.Trim();
        d.Qualification = ClinicScope.Clean(r.Qualification);
        d.Specialization = ClinicScope.Clean(r.Specialization);
        d.RegistrationNo = ClinicScope.Clean(r.RegistrationNo);
        d.Phone = ClinicScope.Clean(r.Phone);
        d.Email = ClinicScope.Clean(r.Email);
        d.Status = r.Status;
        await _db.SaveChangesAsync(ct);
        return d.Id;
    }
}