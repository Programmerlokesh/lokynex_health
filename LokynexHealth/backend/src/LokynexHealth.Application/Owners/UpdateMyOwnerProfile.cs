using FluentValidation;
using FluentValidation.Results;
using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Owners;

/// <summary>A staff member editing THEIR OWN profile (PUT /api/owner/me).
/// Role, Login ID, panel access and Active/Inactive stay SuperAdmin-only — they are
/// deliberately not part of this command, so a staff member can never change them.</summary>
public class UpdateMyOwnerProfileCommand : IRequest
{
    public string Name { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? WhatsappNumber { get; set; }
    public string? Address { get; set; }
    public string? Pincode { get; set; }
    /// <summary>null = keep, "" = remove, anything else = replace.</summary>
    public string? ProfilePictureUrl { get; set; }
    /// <summary>Required only when NewPassword is given.</summary>
    public string? CurrentPassword { get; set; }
    /// <summary>Empty = keep the current password.</summary>
    public string? NewPassword { get; set; }
}

public class UpdateMyOwnerProfileCommandValidator : AbstractValidator<UpdateMyOwnerProfileCommand>
{
    public UpdateMyOwnerProfileCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Phone).Must(p => PhoneNormalizer.ToIndianMobile(p) != null)
            .WithMessage("Enter a valid 10-digit mobile number.");
        RuleFor(x => x.WhatsappNumber)
            .Must(p => string.IsNullOrWhiteSpace(p) || PhoneNormalizer.ToIndianMobile(p) != null)
            .WithMessage("Enter a valid 10-digit WhatsApp number.");
        RuleFor(x => x.Pincode)
            .Must(p => string.IsNullOrWhiteSpace(p) || (p.Trim().Length == 6 && p.Trim().All(char.IsDigit)))
            .WithMessage("Pincode must be 6 digits.");
        RuleFor(x => x.ProfilePictureUrl).MaximumLength(400_000)
            .WithMessage("Profile picture is too large.");
        RuleFor(x => x.NewPassword).MinimumLength(8)
            .When(x => !string.IsNullOrEmpty(x.NewPassword));
        RuleFor(x => x.CurrentPassword).NotEmpty()
            .When(x => !string.IsNullOrEmpty(x.NewPassword))
            .WithMessage("Enter your current password to set a new one.");
    }
}

public class UpdateMyOwnerProfileCommandHandler : IRequestHandler<UpdateMyOwnerProfileCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    private readonly IPasswordHasher _hasher;

    public UpdateMyOwnerProfileCommandHandler(
        IApplicationDbContext db, ICurrentUserService user, IPasswordHasher hasher)
    {
        _db = db;
        _user = user;
        _hasher = hasher;
    }

    public async Task Handle(UpdateMyOwnerProfileCommand r, CancellationToken ct)
    {
        // Must be a staff token AND still Active (401 signs a deactivated user out).
        var active = await OwnerAccess.RequireActiveOwnerAsync(_db, _user, ct);

        // RequireActiveOwnerAsync is AsNoTracking, so load the tracked row to edit it.
        var owner = await _db.Owners.FirstOrDefaultAsync(o => o.Id == active.Id, ct)
            ?? throw new NotFoundException("Owner", active.Id);

        if (!string.IsNullOrEmpty(r.NewPassword))
        {
            if (string.IsNullOrEmpty(r.CurrentPassword) ||
                !_hasher.VerifyPassword(r.CurrentPassword, owner.PasswordHash))
            {
                // 400 (not 401) so a typo here doesn't log the user out.
                throw new ValidationException(new[]
                {
                    new ValidationFailure(nameof(r.CurrentPassword), "Current password is incorrect.")
                });
            }
            owner.PasswordHash = _hasher.HashPassword(r.NewPassword);
        }

        owner.Name = r.Name.Trim();
        owner.Phone = PhoneNormalizer.ToIndianMobile(r.Phone)!;
        owner.WhatsappNumber = PhoneNormalizer.ToIndianMobile(r.WhatsappNumber);
        owner.Address = string.IsNullOrWhiteSpace(r.Address) ? null : r.Address.Trim();
        owner.Pincode = string.IsNullOrWhiteSpace(r.Pincode) ? null : r.Pincode.Trim();
        if (r.ProfilePictureUrl is not null)
            owner.ProfilePictureUrl = r.ProfilePictureUrl == "" ? null : r.ProfilePictureUrl;
        owner.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(ct);
    }
}