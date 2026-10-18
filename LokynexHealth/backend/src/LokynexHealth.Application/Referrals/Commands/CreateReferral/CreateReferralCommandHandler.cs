using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Referrals.Commands.CreateReferral;

public class CreateReferralCommandHandler : IRequestHandler<CreateReferralCommand, Guid>
{
    private readonly IApplicationDbContext _db;

    public CreateReferralCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    private static string? Clean(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    public async Task<Guid> Handle(CreateReferralCommand request, CancellationToken cancellationToken)
    {
        var fullName = request.FullName.Trim();
        var phone = PhoneNormalizer.ToIndianMobile(request.Phone)
            ?? throw new ConflictException("Enter a valid 10-digit Indian mobile number.");
        var whatsapp = PhoneNormalizer.ToIndianMobile(request.WhatsappNumber);
        var email = Clean(request.Email);

        // ---- Duplicate check 1: same phone ----
        if (PhoneNormalizer.FormatInsensitiveLikePattern(phone) is { } pattern)
        {
            // (a) the GLOBAL registry (what every lab shares)
            var globalCandidates = await _db.GlobalReferrals
                .AsNoTracking()
                .Where(r => EF.Functions.Like(r.Phone, pattern))
                .Select(r => new { r.Id, r.FullName, r.Phone })
                .ToListAsync(cancellationToken);

            var globalSame = globalCandidates.FirstOrDefault(c => PhoneNormalizer.MatchKey(c.Phone) == phone);
            if (globalSame is not null)
                return await ReuseOrConflictAsync(
                    globalSame.Id,
                    $"A referral with this phone number already exists: {globalSame.FullName} ({globalSame.Phone}).",
                    cancellationToken);

            // (b) numbers THIS lab edited on other referrals
            var labCandidates = await _db.Referrals
                .AsNoTracking()
                .Where(r => EF.Functions.Like(r.Phone, pattern))
                .Select(r => new { r.FullName, r.Phone })
                .ToListAsync(cancellationToken);

            var labSame = labCandidates.FirstOrDefault(c => PhoneNormalizer.MatchKey(c.Phone) == phone);
            if (labSame is not null)
                throw new ConflictException(
                    $"A referral with this phone number already exists: {labSame.FullName} ({labSame.Phone}).");
        }

        // ---- Duplicate check 2: same email (case-insensitive) ----
        if (email is not null)
        {
            var emailPattern = SqlLike.Escape(email);

            var globalSame = await _db.GlobalReferrals
                .AsNoTracking()
                .Where(r => r.Email != null && EF.Functions.ILike(r.Email, emailPattern))
                .Select(r => new { r.Id, r.FullName })
                .FirstOrDefaultAsync(cancellationToken);

            if (globalSame is not null)
                return await ReuseOrConflictAsync(
                    globalSame.Id,
                    $"A referral with email '{email}' already exists: {globalSame.FullName}.",
                    cancellationToken);

            var labSame = await _db.Referrals
                .AsNoTracking()
                .Where(r => r.Email != null && EF.Functions.ILike(r.Email, emailPattern))
                .Select(r => r.FullName)
                .FirstOrDefaultAsync(cancellationToken);

            if (labSame is not null)
                throw new ConflictException($"A referral with email '{email}' already exists: {labSame}.");
        }

        // New referral goes to the GLOBAL registry -> every lab can see and use it.
        var referral = new GlobalReferral
        {
            Id = Guid.NewGuid(),
            FullName = fullName,
            Phone = phone,
            WhatsappNumber = whatsapp,
            Email = email,
            Address = Clean(request.Address),
            Status = PlatformRecordStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.GlobalReferrals.Add(referral);
        await _db.SaveChangesAsync(cancellationToken);

        return referral.Id;
    }

    /// <summary>
    /// The referral already exists globally. If THIS lab had removed it earlier, bring it
    /// back to this lab's list (Active) and reuse it; otherwise it is a real duplicate.
    /// </summary>
    private async Task<Guid> ReuseOrConflictAsync(Guid referralId, string conflictMessage, CancellationToken ct)
    {
        var hidden = await _db.ReferralLabOverrides
            .FirstOrDefaultAsync(o => o.ReferralId == referralId && o.IsHidden, ct);

        if (hidden is null)
            throw new ConflictException(conflictMessage);

        hidden.IsHidden = false;
        hidden.Status = PlatformRecordStatus.Active;
        hidden.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);

        return referralId;
    }
}