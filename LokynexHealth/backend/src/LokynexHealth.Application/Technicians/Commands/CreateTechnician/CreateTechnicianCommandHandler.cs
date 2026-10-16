using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Technicians.Commands.CreateTechnician;

public class CreateTechnicianCommandHandler : IRequestHandler<CreateTechnicianCommand, Guid>
{
    private readonly IApplicationDbContext _db;

    public CreateTechnicianCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    private static string? Clean(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    public async Task<Guid> Handle(CreateTechnicianCommand request, CancellationToken cancellationToken)
    {
        var branchExists = await _db.Branches.AnyAsync(b => b.Id == request.BranchId, cancellationToken);
        if (!branchExists)
            throw new NotFoundException(nameof(Branch), request.BranchId);

        var phone = PhoneNormalizer.ToIndianMobile(request.Phone)
            ?? throw new ConflictException("Enter a valid 10-digit Indian mobile number.");
        var whatsapp = PhoneNormalizer.ToIndianMobile(request.WhatsappNumber);
        var email = Clean(request.Email);

        // Technicians live in the lab's own schema, so duplicates are checked within this lab.
        if (PhoneNormalizer.FormatInsensitiveLikePattern(phone) is { } pattern)
        {
            var candidates = await _db.Technicians
                .AsNoTracking()
                .Where(t => EF.Functions.Like(t.Phone, pattern))
                .Select(t => new { t.FullName, t.Phone, t.Status })
                .ToListAsync(cancellationToken);

            var samePhone = candidates.FirstOrDefault(c => PhoneNormalizer.MatchKey(c.Phone) == phone);
            if (samePhone is not null)
            {
                var state = samePhone.Status == RecordStatus.Active ? string.Empty : $" [{samePhone.Status}]";
                throw new ConflictException(
                    $"A technician with this phone number already exists: {samePhone.FullName} ({samePhone.Phone}){state}.");
            }
        }

        if (email is not null)
        {
            var emailPattern = SqlLike.Escape(email);
            var sameEmail = await _db.Technicians
                .AsNoTracking()
                .Where(t => t.Email != null && EF.Functions.ILike(t.Email, emailPattern))
                .Select(t => t.FullName)
                .FirstOrDefaultAsync(cancellationToken);

            if (sameEmail is not null)
                throw new ConflictException(
                    $"A technician with email '{email}' already exists: {sameEmail}.");
        }

        var technician = new Technician
        {
            Id = Guid.NewGuid(),
            BranchId = request.BranchId,
            FullName = request.FullName.Trim(),
            Phone = phone,
            WhatsappNumber = whatsapp,
            Email = email,
            Address = Clean(request.Address),
            Status = RecordStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.Technicians.Add(technician);
        await _db.SaveChangesAsync(cancellationToken);

        return technician.Id;
    }
}