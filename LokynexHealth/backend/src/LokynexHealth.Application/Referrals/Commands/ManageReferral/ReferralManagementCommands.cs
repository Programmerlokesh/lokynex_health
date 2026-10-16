using FluentValidation;
using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Referrals.Commands.ManageReferral;

// =====================================================================
// UPDATE
// =====================================================================
public class UpdateReferralCommand : IRequest
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? WhatsappNumber { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
}

public class UpdateReferralCommandValidator : AbstractValidator<UpdateReferralCommand>
{
    public UpdateReferralCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Phone)
            .NotEmpty()
            .Must(p => PhoneNormalizer.ToIndianMobile(p) is not null)
            .WithMessage("Enter a valid 10-digit Indian mobile number (starts with 6, 7, 8 or 9).");
        RuleFor(x => x.WhatsappNumber)
            .Must(p => PhoneNormalizer.ToIndianMobile(p) is not null)
            .WithMessage("Enter a valid 10-digit WhatsApp number (starts with 6, 7, 8 or 9).")
            .When(x => !string.IsNullOrWhiteSpace(x.WhatsappNumber));
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
    }
}

public class UpdateReferralCommandHandler : IRequestHandler<UpdateReferralCommand>
{
    private readonly IApplicationDbContext _db;

    public UpdateReferralCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    private static string? Clean(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    public async Task Handle(UpdateReferralCommand request, CancellationToken cancellationToken)
    {
        var referral = await _db.Referrals.FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Referral), request.Id);

        var phone = PhoneNormalizer.ToIndianMobile(request.Phone)
            ?? throw new ConflictException("Enter a valid 10-digit Indian mobile number.");
        var whatsapp = PhoneNormalizer.ToIndianMobile(request.WhatsappNumber);
        var email = Clean(request.Email);

        if (PhoneNormalizer.FormatInsensitiveLikePattern(phone) is { } pattern)
        {
            var candidates = await _db.Referrals
                .AsNoTracking()
                .Where(r => r.Id != request.Id && EF.Functions.Like(r.Phone, pattern))
                .Select(r => new { r.FullName, r.Phone })
                .ToListAsync(cancellationToken);

            var samePhone = candidates.FirstOrDefault(c => PhoneNormalizer.MatchKey(c.Phone) == phone);
            if (samePhone is not null)
                throw new ConflictException(
                    $"Another referral with this phone number already exists: {samePhone.FullName} ({samePhone.Phone}).");
        }

        if (email is not null)
        {
            var emailPattern = SqlLike.Escape(email);
            var sameEmail = await _db.Referrals
                .AsNoTracking()
                .Where(r => r.Id != request.Id && r.Email != null && EF.Functions.ILike(r.Email, emailPattern))
                .Select(r => r.FullName)
                .FirstOrDefaultAsync(cancellationToken);

            if (sameEmail is not null)
                throw new ConflictException(
                    $"Another referral with email '{email}' already exists: {sameEmail}.");
        }

        referral.FullName = request.FullName.Trim();
        referral.Phone = phone;
        referral.WhatsappNumber = whatsapp;
        referral.Email = email;
        referral.Address = Clean(request.Address);
        referral.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
    }
}

// =====================================================================
// ACTIVATE / DEACTIVATE
// =====================================================================
public class SetReferralStatusCommand : IRequest
{
    public Guid Id { get; set; }
    public bool IsActive { get; set; }
}

public class SetReferralStatusCommandHandler : IRequestHandler<SetReferralStatusCommand>
{
    private readonly IApplicationDbContext _db;

    public SetReferralStatusCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(SetReferralStatusCommand request, CancellationToken cancellationToken)
    {
        var referral = await _db.Referrals.FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Referral), request.Id);

        var target = request.IsActive ? PlatformRecordStatus.Active : PlatformRecordStatus.Inactive;
        if (referral.Status == target) return;

        referral.Status = target;
        referral.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
    }
}

// =====================================================================
// DELETE
// =====================================================================
public class DeleteReferralCommand : IRequest
{
    public Guid Id { get; set; }
}

public class DeleteReferralCommandHandler : IRequestHandler<DeleteReferralCommand>
{
    private readonly IApplicationDbContext _db;

    public DeleteReferralCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(DeleteReferralCommand request, CancellationToken cancellationToken)
    {
        var referral = await _db.Referrals.FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Referral), request.Id);

        _db.Referrals.Remove(referral);
        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            throw new ConflictException(
                $"{referral.FullName} is already used in orders or commissions, " +
                "so it can't be deleted. Deactivate instead.");
        }
    }
}