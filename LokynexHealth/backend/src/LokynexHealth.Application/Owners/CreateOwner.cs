using FluentValidation;
using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Owners;

public class CreateOwnerCommand : IRequest<Guid>, IOwnerFields
{
    public string Name { get; set; } = default!;
    public string Role { get; set; } = default!;
    public string Username { get; set; } = default!;
    public string Password { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? WhatsappNumber { get; set; }
    public string? Address { get; set; }
    public string? Pincode { get; set; }
    public string? ProfilePictureUrl { get; set; }
    /// <summary>Panels this staff member may open. Empty/null = none.</summary>
    public List<StaffPermissionDto>? Permissions { get; set; }
}

/// <summary>Fields shared by create + update, so both use the same rules.</summary>
public interface IOwnerFields
{
    string Name { get; }
    string Role { get; }
    string Phone { get; }
    string? WhatsappNumber { get; }
    string? Pincode { get; }
    string? ProfilePictureUrl { get; }
    List<StaffPermissionDto>? Permissions { get; }
}

public static class OwnerRules
{
    public static void Apply<T>(AbstractValidator<T> v) where T : IOwnerFields
    {
        v.RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        v.RuleFor(x => x.Role).Must(r => OwnerRoles.All.Contains(r))
            .WithMessage("Choose a valid role.");
        v.RuleFor(x => x.Phone).Must(p => PhoneNormalizer.ToIndianMobile(p) != null)
            .WithMessage("Enter a valid 10-digit mobile number.");
        v.RuleFor(x => x.WhatsappNumber)
            .Must(p => string.IsNullOrWhiteSpace(p) || PhoneNormalizer.ToIndianMobile(p) != null)
            .WithMessage("Enter a valid 10-digit WhatsApp number.");
        v.RuleFor(x => x.Pincode)
            .Must(p => string.IsNullOrWhiteSpace(p) || (p.Trim().Length == 6 && p.Trim().All(char.IsDigit)))
            .WithMessage("Pincode must be 6 digits.");
        v.RuleFor(x => x.Permissions)
            .Must(list => list is null || list.All(StaffPanels.IsValid))
            .WithMessage("Choose a valid panel and access level.");
        // ~400 KB of base64 is far above a 192px avatar and stops abuse.
        v.RuleFor(x => x.ProfilePictureUrl).MaximumLength(400_000)
            .WithMessage("Profile picture is too large.");
    }
}

public class CreateOwnerCommandValidator : AbstractValidator<CreateOwnerCommand>
{
    public CreateOwnerCommandValidator()
    {
        OwnerRules.Apply(this);
        RuleFor(x => x.Username).NotEmpty().MinimumLength(3).MaximumLength(100)
            .Matches("^[A-Za-z0-9._-]+$").WithMessage("Login ID may use letters, digits . _ - only.");
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8);
    }
}

public class CreateOwnerCommandHandler : IRequestHandler<CreateOwnerCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly ICurrentUserService _currentUser;

    public CreateOwnerCommandHandler(IApplicationDbContext db, IPasswordHasher hasher, ICurrentUserService currentUser)
    {
        _db = db;
        _hasher = hasher;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(CreateOwnerCommand r, CancellationToken ct)
    {
        var username = r.Username.Trim();

        // The single login page tries every account kind, so a login ID must be
        // unique across staff, SuperAdmins, lab admins and lab users.
        var taken =
            await _db.Owners.AnyAsync(o => o.Username == username, ct) ||
            await _db.SuperAdmins.AnyAsync(s => s.Username == username, ct) ||
            await _db.Tenants.AnyAsync(t => t.AdminUsername == username, ct) ||
            await _db.Users.AnyAsync(u => u.Username == username, ct);
        if (taken) throw new ConflictException($"Login ID '{username}' is already in use.");

        var owner = new Owner
        {
            Id = Guid.NewGuid(),
            Name = r.Name.Trim(),
            Role = r.Role,
            Username = username,
            PasswordHash = _hasher.HashPassword(r.Password),
            Phone = PhoneNormalizer.ToIndianMobile(r.Phone)!,
            WhatsappNumber = PhoneNormalizer.ToIndianMobile(r.WhatsappNumber),
            Address = string.IsNullOrWhiteSpace(r.Address) ? null : r.Address.Trim(),
            Pincode = string.IsNullOrWhiteSpace(r.Pincode) ? null : r.Pincode.Trim(),
            ProfilePictureUrl = string.IsNullOrWhiteSpace(r.ProfilePictureUrl) ? null : r.ProfilePictureUrl,
            Permissions = StaffPanels.Serialize(r.Permissions),
            Status = PlatformRecordStatus.Active,
            CreatedBy = _currentUser.UserId,
            CreatedAt = DateTimeOffset.UtcNow
        };
        _db.Owners.Add(owner);
        await _db.SaveChangesAsync(ct);
        return owner.Id;
    }
}