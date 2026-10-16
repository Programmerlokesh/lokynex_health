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

        // ---- Duplicate check 1: same phone number (global registry) ----
        if (PhoneNormalizer.FormatInsensitiveLikePattern(phone) is { } pattern)
        {
            var candidates = await _db.Referrals
                .AsNoTracking()
                .Where(r => EF.Functions.Like(r.Phone, pattern))
                .Select(r => new { r.FullName, r.Phone, r.Status })
                .ToListAsync(cancellationToken);

            var samePhone = candidates.FirstOrDefault(c => PhoneNormalizer.MatchKey(c.Phone) == phone);
            if (samePhone is not null)
            {
                var state = samePhone.Status == PlatformRecordStatus.Active
                    ? string.Empty
                    : $" [{samePhone.Status}]";
                throw new ConflictException(
                    $"A referral with this phone number already exists: {samePhone.FullName} ({samePhone.Phone}){state}.");
            }
        }

        // ---- Duplicate check 2: same email (case-insensitive) ----
        if (email is not null)
        {
            var emailPattern = SqlLike.Escape(email);
            var sameEmail = await _db.Referrals
                .AsNoTracking()
                .Where(r => r.Email != null && EF.Functions.ILike(r.Email, emailPattern))
                .Select(r => r.FullName)
                .FirstOrDefaultAsync(cancellationToken);

            if (sameEmail is not null)
                throw new ConflictException(
                    $"A referral with email '{email}' already exists: {sameEmail}.");
        }

        var referral = new Referral
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

        _db.Referrals.Add(referral);
        await _db.SaveChangesAsync(cancellationToken);

        return referral.Id;
    }
}