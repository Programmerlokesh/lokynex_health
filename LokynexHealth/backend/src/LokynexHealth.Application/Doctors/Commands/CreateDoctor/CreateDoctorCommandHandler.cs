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

    public async Task<Guid> Handle(CreateDoctorCommand request, CancellationToken cancellationToken)
    {
        var fullName = request.FullName.Trim();
        // Always stored as exactly 10 digits (the validator already rejected anything else).
        var phone = PhoneNormalizer.ToIndianMobile(request.Phone)
            ?? throw new ConflictException("Enter a valid 10-digit Indian mobile number.");
        var email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();

        // ---- Duplicate check 1: same phone number ----
        // Doctors are a GLOBAL registry shared by every lab, so this checks all of them.
        // Old rows may still be stored with spaces / +91, hence the format-insensitive match.
        if (PhoneNormalizer.FormatInsensitiveLikePattern(phone) is { } pattern)
        {
            var candidates = await _db.Doctors
                .AsNoTracking()
                .Where(d => EF.Functions.Like(d.Phone, pattern))
                .Select(d => new { d.FullName, d.Phone, d.Status })
                .ToListAsync(cancellationToken);

            var samePhone = candidates.FirstOrDefault(c => PhoneNormalizer.MatchKey(c.Phone) == phone);
            if (samePhone is not null)
            {
                var state = samePhone.Status == PlatformRecordStatus.Active
                    ? string.Empty
                    : $" [{samePhone.Status}]";
                throw new ConflictException(
                    $"A doctor with this phone number already exists: {samePhone.FullName} ({samePhone.Phone}){state}.");
            }
        }

        // ---- Duplicate check 2: same email (case-insensitive) ----
        if (email is not null)
        {
            var emailPattern = SqlLike.Escape(email);
            var sameEmail = await _db.Doctors
                .AsNoTracking()
                .Where(d => d.Email != null && EF.Functions.ILike(d.Email, emailPattern))
                .Select(d => d.FullName)
                .FirstOrDefaultAsync(cancellationToken);

            if (sameEmail is not null)
                throw new ConflictException(
                    $"A doctor with email '{email}' already exists: {sameEmail}.");
        }

        var doctor = new Doctor
        {
            Id = Guid.NewGuid(),
            FullName = fullName,
            Phone = phone,
            Email = email,
            Address = request.Address,
            Specialization = request.Specialization,
            Status = PlatformRecordStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.Doctors.Add(doctor);
        await _db.SaveChangesAsync(cancellationToken);

        return doctor.Id;
    }
}