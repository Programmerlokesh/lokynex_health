using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Doctors.Commands.UpdateDoctor;

public class UpdateDoctorCommandHandler : IRequestHandler<UpdateDoctorCommand>
{
    private readonly IApplicationDbContext _db;

    public UpdateDoctorCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(UpdateDoctorCommand request, CancellationToken cancellationToken)
    {
        var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Doctor), request.Id);

        var fullName = request.FullName.Trim();
        var phone = PhoneNormalizer.ToIndianMobile(request.Phone)
            ?? throw new ConflictException("Enter a valid 10-digit Indian mobile number.");
        var email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();

        // ---- Duplicate check 1: same phone on ANOTHER doctor ----
        if (PhoneNormalizer.FormatInsensitiveLikePattern(phone) is { } pattern)
        {
            var candidates = await _db.Doctors
                .AsNoTracking()
                .Where(d => d.Id != request.Id && EF.Functions.Like(d.Phone, pattern))
                .Select(d => new { d.FullName, d.Phone })
                .ToListAsync(cancellationToken);

            var samePhone = candidates.FirstOrDefault(c => PhoneNormalizer.MatchKey(c.Phone) == phone);
            if (samePhone is not null)
                throw new ConflictException(
                    $"Another doctor already uses this phone number: {samePhone.FullName} ({samePhone.Phone}).");
        }

        // ---- Duplicate check 2: same email on ANOTHER doctor ----
        if (email is not null)
        {
            var emailPattern = SqlLike.Escape(email);
            var sameEmail = await _db.Doctors
                .AsNoTracking()
                .Where(d => d.Id != request.Id && d.Email != null && EF.Functions.ILike(d.Email, emailPattern))
                .Select(d => d.FullName)
                .FirstOrDefaultAsync(cancellationToken);

            if (sameEmail is not null)
                throw new ConflictException($"Another doctor already uses the email '{email}': {sameEmail}.");
        }

        doctor.FullName = fullName;
        doctor.Phone = phone;
        doctor.Email = email;
        doctor.Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim();
        doctor.Specialization = string.IsNullOrWhiteSpace(request.Specialization) ? null : request.Specialization.Trim();
        doctor.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
    }
}