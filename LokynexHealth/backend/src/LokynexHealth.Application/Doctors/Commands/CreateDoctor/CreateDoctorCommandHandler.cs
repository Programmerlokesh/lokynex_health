using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Doctors.Commands.CreateDoctor;

public class CreateDoctorCommandHandler : IRequestHandler<CreateDoctorCommand, Guid>
{
    private readonly IApplicationDbContext _db;

    public CreateDoctorCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    private static string? Clean(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    public async Task<Guid> Handle(CreateDoctorCommand request, CancellationToken cancellationToken)
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
            var globalCandidates = await _db.GlobalDoctors
                .AsNoTracking()
                .Where(d => EF.Functions.Like(d.Phone, pattern))
                .Select(d => new { d.Id, d.FullName, d.Phone })
                .ToListAsync(cancellationToken);

            var globalSame = globalCandidates.FirstOrDefault(c => PhoneNormalizer.MatchKey(c.Phone) == phone);
            if (globalSame is not null)
                return await ReuseOrConflictAsync(
                    globalSame.Id,
                    $"A doctor with this phone number already exists: {globalSame.FullName} ({globalSame.Phone}).",
                    cancellationToken);

            // (b) numbers THIS lab edited on other doctors
            var labCandidates = await _db.Doctors
                .AsNoTracking()
                .Where(d => EF.Functions.Like(d.Phone, pattern))
                .Select(d => new { d.FullName, d.Phone })
                .ToListAsync(cancellationToken);

            var labSame = labCandidates.FirstOrDefault(c => PhoneNormalizer.MatchKey(c.Phone) == phone);
            if (labSame is not null)
                throw new ConflictException(
                    $"A doctor with this phone number already exists: {labSame.FullName} ({labSame.Phone}).");
        }

        // ---- Duplicate check 2: same email (case-insensitive) ----
        if (email is not null)
        {
            var emailPattern = SqlLike.Escape(email);

            var globalSame = await _db.GlobalDoctors
                .AsNoTracking()
                .Where(d => d.Email != null && EF.Functions.ILike(d.Email, emailPattern))
                .Select(d => new { d.Id, d.FullName })
                .FirstOrDefaultAsync(cancellationToken);

            if (globalSame is not null)
                return await ReuseOrConflictAsync(
                    globalSame.Id,
                    $"A doctor with email '{email}' already exists: {globalSame.FullName}.",
                    cancellationToken);

            var labSame = await _db.Doctors
                .AsNoTracking()
                .Where(d => d.Email != null && EF.Functions.ILike(d.Email, emailPattern))
                .Select(d => d.FullName)
                .FirstOrDefaultAsync(cancellationToken);

            if (labSame is not null)
                throw new ConflictException($"A doctor with email '{email}' already exists: {labSame}.");
        }

        // New doctor goes to the GLOBAL registry -> every lab can see and use it.
        var doctor = new GlobalDoctor
        {
            Id = Guid.NewGuid(),
            FullName = fullName,
            Phone = phone,
            WhatsappNumber = whatsapp,
            Email = email,
            Address = Clean(request.Address),
            Specialization = Clean(request.Specialization),
            Status = PlatformRecordStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.GlobalDoctors.Add(doctor);
        await _db.SaveChangesAsync(cancellationToken);

        return doctor.Id;
    }

    /// <summary>
    /// The doctor already exists globally. If THIS lab had removed it earlier, bring it
    /// back to this lab's list (Active) and reuse it; otherwise it is a real duplicate.
    /// </summary>
    private async Task<Guid> ReuseOrConflictAsync(Guid doctorId, string conflictMessage, CancellationToken ct)
    {
        var hidden = await _db.DoctorLabOverrides
            .FirstOrDefaultAsync(o => o.DoctorId == doctorId && o.IsHidden, ct);

        if (hidden is null)
            throw new ConflictException(conflictMessage);

        hidden.IsHidden = false;
        hidden.Status = PlatformRecordStatus.Active;
        hidden.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);

        return doctorId;
    }
}