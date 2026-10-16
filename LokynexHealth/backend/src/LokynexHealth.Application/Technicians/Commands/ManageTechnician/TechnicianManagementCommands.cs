using FluentValidation;
using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Technicians.Commands.ManageTechnician;

// =====================================================================
// UPDATE
// =====================================================================
public class UpdateTechnicianCommand : IRequest
{
    public Guid Id { get; set; }
    public Guid BranchId { get; set; }
    public string FullName { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? WhatsappNumber { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
}

public class UpdateTechnicianCommandValidator : AbstractValidator<UpdateTechnicianCommand>
{
    public UpdateTechnicianCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.BranchId).NotEmpty();
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

public class UpdateTechnicianCommandHandler : IRequestHandler<UpdateTechnicianCommand>
{
    private readonly IApplicationDbContext _db;

    public UpdateTechnicianCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    private static string? Clean(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    public async Task Handle(UpdateTechnicianCommand request, CancellationToken cancellationToken)
    {
        var technician = await _db.Technicians.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Technician), request.Id);

        if (technician.BranchId != request.BranchId)
        {
            var branchExists = await _db.Branches.AnyAsync(b => b.Id == request.BranchId, cancellationToken);
            if (!branchExists)
                throw new NotFoundException(nameof(Branch), request.BranchId);
        }

        var phone = PhoneNormalizer.ToIndianMobile(request.Phone)
            ?? throw new ConflictException("Enter a valid 10-digit Indian mobile number.");
        var whatsapp = PhoneNormalizer.ToIndianMobile(request.WhatsappNumber);
        var email = Clean(request.Email);

        if (PhoneNormalizer.FormatInsensitiveLikePattern(phone) is { } pattern)
        {
            var candidates = await _db.Technicians
                .AsNoTracking()
                .Where(t => t.Id != request.Id && EF.Functions.Like(t.Phone, pattern))
                .Select(t => new { t.FullName, t.Phone })
                .ToListAsync(cancellationToken);

            var samePhone = candidates.FirstOrDefault(c => PhoneNormalizer.MatchKey(c.Phone) == phone);
            if (samePhone is not null)
                throw new ConflictException(
                    $"Another technician with this phone number already exists: {samePhone.FullName} ({samePhone.Phone}).");
        }

        if (email is not null)
        {
            var emailPattern = SqlLike.Escape(email);
            var sameEmail = await _db.Technicians
                .AsNoTracking()
                .Where(t => t.Id != request.Id && t.Email != null && EF.Functions.ILike(t.Email, emailPattern))
                .Select(t => t.FullName)
                .FirstOrDefaultAsync(cancellationToken);

            if (sameEmail is not null)
                throw new ConflictException(
                    $"Another technician with email '{email}' already exists: {sameEmail}.");
        }

        technician.BranchId = request.BranchId;
        technician.FullName = request.FullName.Trim();
        technician.Phone = phone;
        technician.WhatsappNumber = whatsapp;
        technician.Email = email;
        technician.Address = Clean(request.Address);
        technician.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
    }
}

// =====================================================================
// ACTIVATE / DEACTIVATE
// =====================================================================
public class SetTechnicianStatusCommand : IRequest
{
    public Guid Id { get; set; }
    public bool IsActive { get; set; }
}

public class SetTechnicianStatusCommandHandler : IRequestHandler<SetTechnicianStatusCommand>
{
    private readonly IApplicationDbContext _db;

    public SetTechnicianStatusCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(SetTechnicianStatusCommand request, CancellationToken cancellationToken)
    {
        var technician = await _db.Technicians.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Technician), request.Id);

        var target = request.IsActive ? RecordStatus.Active : RecordStatus.Inactive;
        if (technician.Status == target) return;

        technician.Status = target;
        technician.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
    }
}

// =====================================================================
// DELETE
// =====================================================================
public class DeleteTechnicianCommand : IRequest
{
    public Guid Id { get; set; }
}

public class DeleteTechnicianCommandHandler : IRequestHandler<DeleteTechnicianCommand>
{
    private readonly IApplicationDbContext _db;

    public DeleteTechnicianCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(DeleteTechnicianCommand request, CancellationToken cancellationToken)
    {
        var technician = await _db.Technicians.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Technician), request.Id);

        _db.Technicians.Remove(technician);
        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            throw new ConflictException(
                $"{technician.FullName} is already used in orders or commissions, " +
                "so it can't be deleted. Deactivate instead.");
        }
    }
}