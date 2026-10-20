using System.Text.RegularExpressions;
using FluentValidation;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Clinics;

// ============================== LOGIN ==============================
public class ClinicLoginCommand : IRequest<ClinicLoginResult>
{
    public string Username { get; set; } = default!;
    public string Password { get; set; } = default!;
}

public class ClinicLoginResult
{
    public string Token { get; set; } = default!;
    public Guid UserId { get; set; }
    public string Name { get; set; } = default!;
    public string Role { get; set; } = default!;
    public Guid ClinicId { get; set; }
    public string ClinicName { get; set; } = default!;
    public bool IsAdmin { get; set; }
    public List<string> Permissions { get; set; } = new();
    public DateTime ExpiresAt { get; set; }
}

public class ClinicLoginCommandHandler : IRequestHandler<ClinicLoginCommand, ClinicLoginResult>
{
    private const string Generic = "Invalid username or password.";
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenGenerator _tokens;

    public ClinicLoginCommandHandler(IApplicationDbContext db, IPasswordHasher hasher, IJwtTokenGenerator tokens)
    {
        _db = db;
        _hasher = hasher;
        _tokens = tokens;
    }

    public async Task<ClinicLoginResult> Handle(ClinicLoginCommand r, CancellationToken ct)
    {
        // 1) the clinic's main admin account
        var clinic = await _db.Clinics.AsNoTracking().FirstOrDefaultAsync(c => c.AdminUsername == r.Username, ct);
        if (clinic is not null)
        {
            if (!_hasher.VerifyPassword(r.Password, clinic.AdminPasswordHash))
                throw new UnauthorizedException(Generic);
            if (clinic.Status != ClinicStatus.Active)
                throw new UnauthorizedException("This clinic account is inactive. Contact the SuperAdmin.");

            var perms = ClinicPermissions.AllPermissionStrings().ToList();
            return new ClinicLoginResult
            {
                Token = _tokens.GenerateClinicToken(clinic.Id, clinic.Id, true, clinic.AdminName, ClinicTokens.Admin, perms),
                UserId = clinic.Id,
                Name = clinic.AdminName,
                Role = ClinicTokens.Admin,
                ClinicId = clinic.Id,
                ClinicName = clinic.Name,
                IsAdmin = true,
                Permissions = perms,
                ExpiresAt = DateTime.UtcNow.AddHours(1)
            };
        }

        // 2) a clinic user (staff)
        var row = await (from u in _db.ClinicUsers.AsNoTracking()
                         join c in _db.Clinics.AsNoTracking() on u.ClinicId equals c.Id
                         where u.Username == r.Username
                         select new { User = u, ClinicName = c.Name, ClinicStatus = c.Status })
            .FirstOrDefaultAsync(ct);

        if (row is null || !_hasher.VerifyPassword(r.Password, row.User.PasswordHash))
            throw new UnauthorizedException(Generic);
        if (row.ClinicStatus != ClinicStatus.Active)
            throw new UnauthorizedException("This clinic account is inactive. Contact the SuperAdmin.");
        if (row.User.Status != ClinicStatus.Active)
            throw new UnauthorizedException("This account is inactive. Contact your clinic admin.");

        var userPerms = ClinicPermissions.Parse(row.User.Permissions).ToList();
        return new ClinicLoginResult
        {
            Token = _tokens.GenerateClinicToken(row.User.ClinicId, row.User.Id, false, row.User.Name, row.User.Role, userPerms),
            UserId = row.User.Id,
            Name = row.User.Name,
            Role = row.User.Role,
            ClinicId = row.User.ClinicId,
            ClinicName = row.ClinicName,
            IsAdmin = false,
            Permissions = userPerms,
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        };
    }
}

// ============================== ME ==============================
public class ClinicMeDto
{
    public Guid ClinicId { get; set; }
    public string ClinicCode { get; set; } = default!;
    public string ClinicName { get; set; } = default!;
    public string? Tagline { get; set; }
    public string Address { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string Pincode { get; set; } = default!;
    public string? RegistrationNo { get; set; }
    public string? LogoUrl { get; set; }
    public string? FooterNote { get; set; }
    public string AccentColor { get; set; } = default!;
    public string ActorName { get; set; } = default!;
    public string ActorUsername { get; set; } = default!;
    public string ActorRole { get; set; } = default!;
    public bool IsAdmin { get; set; }
    public List<string> Permissions { get; set; } = new();
    public int UserLimit { get; set; }
    public int UserCount { get; set; }
}

public class GetClinicMeQuery : IRequest<ClinicMeDto> { }

public class GetClinicMeQueryHandler : IRequestHandler<GetClinicMeQuery, ClinicMeDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public GetClinicMeQueryHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task<ClinicMeDto> Handle(GetClinicMeQuery r, CancellationToken ct)
    {
        var clinicId = ClinicScope.Id(_user);
        var c = await _db.Clinics.AsNoTracking().FirstOrDefaultAsync(x => x.Id == clinicId, ct)
                ?? throw new UnauthorizedException("Clinic not found.");
        var userCount = await _db.ClinicUsers.CountAsync(u => u.ClinicId == clinicId, ct);

        var dto = new ClinicMeDto
        {
            ClinicId = c.Id,
            ClinicCode = c.ClinicCode,
            ClinicName = c.Name,
            Tagline = c.Tagline,
            Address = c.Address,
            Phone = c.Phone,
            Email = c.Email,
            Pincode = c.Pincode,
            RegistrationNo = c.RegistrationNo,
            LogoUrl = c.LogoUrl,
            FooterNote = c.FooterNote,
            AccentColor = c.AccentColor,
            UserLimit = c.UserLimit,
            UserCount = userCount
        };

        if (_user.IsClinicAdmin)
        {
            dto.ActorName = c.AdminName;
            dto.ActorUsername = c.AdminUsername;
            dto.ActorRole = ClinicTokens.Admin;
            dto.IsAdmin = true;
            dto.Permissions = ClinicPermissions.AllPermissionStrings().ToList();
            return dto;
        }

        var uid = _user.UserId;
        var u = await _db.ClinicUsers.AsNoTracking().FirstOrDefaultAsync(x => x.Id == uid && x.ClinicId == clinicId, ct);
        if (u is null || u.Status != ClinicStatus.Active)
            throw new UnauthorizedException("This account is inactive.");
        dto.ActorName = u.Name;
        dto.ActorUsername = u.Username;
        dto.ActorRole = u.Role;
        dto.Permissions = ClinicPermissions.Parse(u.Permissions).ToList();
        return dto;
    }
}

// ============================== CLINIC SETTINGS (admin only) ==============================
public class UpdateClinicProfileCommand : IRequest
{
    public string? Tagline { get; set; }
    public string Address { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string Pincode { get; set; } = default!;
    public string? RegistrationNo { get; set; }
    /// <summary>Data URL (image/jpeg|png|webp), or empty to remove the logo.</summary>
    public string? LogoUrl { get; set; }
    public string? FooterNote { get; set; }
    public string AccentColor { get; set; } = "#0E7C86";
}

public class UpdateClinicProfileCommandValidator : AbstractValidator<UpdateClinicProfileCommand>
{
    public UpdateClinicProfileCommandValidator()
    {
        RuleFor(x => x.Tagline).MaximumLength(200);
        RuleFor(x => x.Address).NotEmpty();
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(150);
        RuleFor(x => x.Pincode).NotEmpty().MaximumLength(10);
        RuleFor(x => x.RegistrationNo).MaximumLength(60);
        RuleFor(x => x.FooterNote).MaximumLength(300);
        RuleFor(x => x.AccentColor).Matches("^#[0-9A-Fa-f]{6}$").WithMessage("Colour must look like #0E7C86.");
        RuleFor(x => x.LogoUrl).Must(l => string.IsNullOrEmpty(l) || (l.StartsWith("data:image/") && l.Length <= 400_000))
            .WithMessage("Logo must be a small JPG, PNG or WEBP image.");
    }
}

public class UpdateClinicProfileCommandHandler : IRequestHandler<UpdateClinicProfileCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public UpdateClinicProfileCommandHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task Handle(UpdateClinicProfileCommand r, CancellationToken ct)
    {
        var id = ClinicScope.Id(_user);
        var c = await _db.Clinics.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Clinic", id);
        c.Tagline = ClinicScope.Clean(r.Tagline);
        c.Address = r.Address.Trim();
        c.Phone = r.Phone.Trim();
        c.Email = r.Email.Trim();
        c.Pincode = r.Pincode.Trim();
        c.RegistrationNo = ClinicScope.Clean(r.RegistrationNo);
        c.LogoUrl = string.IsNullOrEmpty(r.LogoUrl) ? null : r.LogoUrl;
        c.FooterNote = ClinicScope.Clean(r.FooterNote);
        c.AccentColor = r.AccentColor;
        c.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}

public class ChangeClinicPasswordCommand : IRequest
{
    public string CurrentPassword { get; set; } = default!;
    public string NewPassword { get; set; } = default!;
}

public class ChangeClinicPasswordCommandValidator : AbstractValidator<ChangeClinicPasswordCommand>
{
    public ChangeClinicPasswordCommandValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty();
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(8);
    }
}

public class ChangeClinicPasswordCommandHandler : IRequestHandler<ChangeClinicPasswordCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    private readonly IPasswordHasher _hasher;
    public ChangeClinicPasswordCommandHandler(IApplicationDbContext db, ICurrentUserService user, IPasswordHasher hasher)
    { _db = db; _user = user; _hasher = hasher; }

    public async Task Handle(ChangeClinicPasswordCommand r, CancellationToken ct)
    {
        var clinicId = ClinicScope.Id(_user);
        if (_user.IsClinicAdmin)
        {
            var c = await _db.Clinics.FirstOrDefaultAsync(x => x.Id == clinicId, ct) ?? throw new NotFoundException("Clinic", clinicId);
            if (!_hasher.VerifyPassword(r.CurrentPassword, c.AdminPasswordHash))
                throw new ConflictException("Current password is incorrect.");
            c.AdminPasswordHash = _hasher.HashPassword(r.NewPassword);
        }
        else
        {
            var uid = _user.UserId;
            var u = await _db.ClinicUsers.FirstOrDefaultAsync(x => x.Id == uid && x.ClinicId == clinicId, ct)
                    ?? throw new NotFoundException("User", uid ?? Guid.Empty);
            if (!_hasher.VerifyPassword(r.CurrentPassword, u.PasswordHash))
                throw new ConflictException("Current password is incorrect.");
            u.PasswordHash = _hasher.HashPassword(r.NewPassword);
        }
        await _db.SaveChangesAsync(ct);
    }
}

// ============================== DASHBOARD ==============================
public class ClinicDashboardDto
{
    public int TodayBookings { get; set; }
    public int TodayWaiting { get; set; }
    public int TodayPrescriptions { get; set; }
    public int TotalPatients { get; set; }
    public int TotalPrescriptions { get; set; }
    public decimal MonthIncome { get; set; }
    public decimal MonthOutflow { get; set; }
    public decimal MonthNet { get; set; }
    public List<ClinicPrescriptionListItem> Recent { get; set; } = new();
}

public class GetClinicDashboardQuery : IRequest<ClinicDashboardDto> { }

public class GetClinicDashboardQueryHandler : IRequestHandler<GetClinicDashboardQuery, ClinicDashboardDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public GetClinicDashboardQueryHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task<ClinicDashboardDto> Handle(GetClinicDashboardQuery r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var today = ClinicScope.Today();
        var monthStart = new DateOnly(today.Year, today.Month, 1);

        var bookings = _db.ClinicBookings.AsNoTracking().Where(b => b.ClinicId == cid && b.BookingDate == today && b.Status != BookingStatus.Cancelled);
        var dto = new ClinicDashboardDto
        {
            TodayBookings = await bookings.CountAsync(ct),
            TodayWaiting = await bookings.CountAsync(b => b.Status == BookingStatus.Booked, ct),
            TodayPrescriptions = await _db.ClinicPrescriptions.CountAsync(p => p.ClinicId == cid && p.VisitDate == today, ct),
            TotalPatients = await _db.ClinicPatients.CountAsync(p => p.ClinicId == cid, ct),
            TotalPrescriptions = await _db.ClinicPrescriptions.CountAsync(p => p.ClinicId == cid, ct)
        };

        // One grouped query (3 rows at most) instead of one query per entry type.
        var money = await _db.ClinicLedgerEntries.AsNoTracking()
            .Where(e => e.ClinicId == cid && e.EntryDate >= monthStart && e.EntryDate <= today)
            .GroupBy(e => e.EntryType)
            .Select(g => new { Type = g.Key, Total = g.Sum(x => x.Amount) })
            .ToListAsync(ct);
        dto.MonthIncome = money.Where(m => m.Type == "Income").Sum(m => m.Total);
        dto.MonthOutflow = money.Where(m => m.Type != "Income").Sum(m => m.Total);
        dto.MonthNet = dto.MonthIncome - dto.MonthOutflow;

        dto.Recent = await _db.ClinicPrescriptions.AsNoTracking()
            .Where(p => p.ClinicId == cid)
            .OrderByDescending(p => p.VisitDate).ThenByDescending(p => p.RxSerial)
            .Take(6)
            .Select(p => new ClinicPrescriptionListItem
            {
                Id = p.Id,
                RxNo = p.RxNo,
                VisitDate = p.VisitDate,
                PatientName = p.PatientName,
                PatientAge = p.PatientAge,
                PatientPhone = p.PatientPhone,
                DoctorName = p.DoctorName,
                Diagnosis = p.Diagnosis,
                MedicineCount = p.Items.Count,
                TestCount = p.Tests.Count
            }).ToListAsync(ct);
        return dto;
    }
}