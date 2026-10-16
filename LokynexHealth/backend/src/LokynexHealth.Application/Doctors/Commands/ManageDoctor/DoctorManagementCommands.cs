using FluentValidation;
using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Doctors.Commands.ManageDoctor;

// =====================================================================
// UPDATE
// =====================================================================
public class UpdateDoctorCommand : IRequest
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? WhatsappNumber { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? Specialization { get; set; }
}

public class UpdateDoctorCommandValidator : AbstractValidator<UpdateDoctorCommand>
{
    public UpdateDoctorCommandValidator()
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

public class UpdateDoctorCommandHandler : IRequestHandler<UpdateDoctorCommand>
{
    private readonly IApplicationDbContext _db;

    public UpdateDoctorCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    private static string? Clean(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    public async Task Handle(UpdateDoctorCommand request, CancellationToken cancellationToken)
    {
        var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Doctor), request.Id);

        var phone = PhoneNormalizer.ToIndianMobile(request.Phone)
            ?? throw new ConflictException("Enter a valid 10-digit Indian mobile number.");
        var whatsapp = PhoneNormalizer.ToIndianMobile(request.WhatsappNumber);
        var email = Clean(request.Email);

        // Same duplicate rules as Create, but ignoring this doctor's own row.
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
                    $"Another doctor with this phone number already exists: {samePhone.FullName} ({samePhone.Phone}).");
        }

        if (email is not null)
        {
            var emailPattern = SqlLike.Escape(email);
            var sameEmail = await _db.Doctors
                .AsNoTracking()
                .Where(d => d.Id != request.Id && d.Email != null && EF.Functions.ILike(d.Email, emailPattern))
                .Select(d => d.FullName)
                .FirstOrDefaultAsync(cancellationToken);

            if (sameEmail is not null)
                throw new ConflictException(
                    $"Another doctor with email '{email}' already exists: {sameEmail}.");
        }

        doctor.FullName = request.FullName.Trim();
        doctor.Phone = phone;
        doctor.WhatsappNumber = whatsapp;
        doctor.Email = email;
        doctor.Address = Clean(request.Address);
        doctor.Specialization = Clean(request.Specialization);
        doctor.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
    }
}

// =====================================================================
// ACTIVATE / DEACTIVATE
// =====================================================================
public class SetDoctorStatusCommand : IRequest
{
    public Guid Id { get; set; }
    public bool IsActive { get; set; }
}

public class SetDoctorStatusCommandHandler : IRequestHandler<SetDoctorStatusCommand>
{
    private readonly IApplicationDbContext _db;

    public SetDoctorStatusCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(SetDoctorStatusCommand request, CancellationToken cancellationToken)
    {
        var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Doctor), request.Id);

        var target = request.IsActive ? PlatformRecordStatus.Active : PlatformRecordStatus.Inactive;
        if (doctor.Status == target) return; // nothing to write

        doctor.Status = target;
        doctor.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
    }
}

// =====================================================================
// DELETE (hard delete; blocked by the database if the doctor is in use)
// =====================================================================
public class DeleteDoctorCommand : IRequest
{
    public Guid Id { get; set; }
}

public class DeleteDoctorCommandHandler : IRequestHandler<DeleteDoctorCommand>
{
    private readonly IApplicationDbContext _db;

    public DeleteDoctorCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(DeleteDoctorCommand request, CancellationToken cancellationToken)
    {
        var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Doctor), request.Id);

        _db.Doctors.Remove(doctor);
        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            // Foreign keys (orders, commissions, clinic schedules...) protect real history.
            throw new ConflictException(
                $"Dr. {doctor.FullName} is already used in orders, commissions or clinic schedules, " +
                "so it can't be deleted. Deactivate instead.");
        }
    }
}