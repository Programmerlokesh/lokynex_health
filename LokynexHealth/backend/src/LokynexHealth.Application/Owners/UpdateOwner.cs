using FluentValidation;
using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Owners;

public class UpdateOwnerCommand : IRequest, IOwnerFields
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string Role { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? WhatsappNumber { get; set; }
    public string? Address { get; set; }
    public string? Pincode { get; set; }
    /// <summary>null = keep, "" = remove, anything else = replace.</summary>
    public string? ProfilePictureUrl { get; set; }
    /// <summary>Empty = keep the current password.</summary>
    public string? NewPassword { get; set; }
    /// <summary>null = keep the current panel access, otherwise replace it entirely.</summary>
    public List<StaffPermissionDto>? Permissions { get; set; }
}

public class UpdateOwnerCommandValidator : AbstractValidator<UpdateOwnerCommand>
{
    public UpdateOwnerCommandValidator()
    {
        OwnerRules.Apply(this);
        RuleFor(x => x.NewPassword).MinimumLength(8)
            .When(x => !string.IsNullOrEmpty(x.NewPassword));
    }
}

public class UpdateOwnerCommandHandler : IRequestHandler<UpdateOwnerCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _hasher;

    public UpdateOwnerCommandHandler(IApplicationDbContext db, IPasswordHasher hasher)
    {
        _db = db;
        _hasher = hasher;
    }

    public async Task Handle(UpdateOwnerCommand r, CancellationToken ct)
    {
        var owner = await _db.Owners.FirstOrDefaultAsync(o => o.Id == r.Id, ct)
            ?? throw new NotFoundException("Owner", r.Id);

        owner.Name = r.Name.Trim();
        owner.Role = r.Role;
        owner.Phone = PhoneNormalizer.ToIndianMobile(r.Phone)!;
        owner.WhatsappNumber = PhoneNormalizer.ToIndianMobile(r.WhatsappNumber);
        owner.Address = string.IsNullOrWhiteSpace(r.Address) ? null : r.Address.Trim();
        owner.Pincode = string.IsNullOrWhiteSpace(r.Pincode) ? null : r.Pincode.Trim();
        if (r.ProfilePictureUrl is not null)
            owner.ProfilePictureUrl = r.ProfilePictureUrl == "" ? null : r.ProfilePictureUrl;
        if (!string.IsNullOrEmpty(r.NewPassword))
            owner.PasswordHash = _hasher.HashPassword(r.NewPassword);
        if (r.Permissions is not null)
            owner.Permissions = StaffPanels.Serialize(r.Permissions);
        owner.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(ct);
    }
}

public class SetOwnerStatusCommand : IRequest
{
    public Guid Id { get; set; }
    public string Status { get; set; } = default!; // Active | Inactive
}

public class SetOwnerStatusCommandValidator : AbstractValidator<SetOwnerStatusCommand>
{
    public SetOwnerStatusCommandValidator()
    {
        RuleFor(x => x.Status).Must(s => s is "Active" or "Inactive")
            .WithMessage("Status must be Active or Inactive.");
    }
}

public class SetOwnerStatusCommandHandler : IRequestHandler<SetOwnerStatusCommand>
{
    private readonly IApplicationDbContext _db;
    public SetOwnerStatusCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task Handle(SetOwnerStatusCommand r, CancellationToken ct)
    {
        var owner = await _db.Owners.FirstOrDefaultAsync(o => o.Id == r.Id, ct)
            ?? throw new NotFoundException("Owner", r.Id);
        owner.Status = r.Status == "Active" ? PlatformRecordStatus.Active : PlatformRecordStatus.Inactive;
        owner.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}