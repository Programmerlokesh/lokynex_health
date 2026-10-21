using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Clinics;

/// <summary>SuperAdmin: permanently delete a clinic. Every clinic table (users, doctors, schedules,
/// bookings, patients, medicines, prescriptions, ledger) is ON DELETE CASCADE from platform.clinics.</summary>
public class DeleteClinicCommand : IRequest
{
    public Guid Id { get; set; }
}

public class DeleteClinicCommandHandler : IRequestHandler<DeleteClinicCommand>
{
    private readonly IApplicationDbContext _db;
    public DeleteClinicCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task Handle(DeleteClinicCommand r, CancellationToken ct)
    {
        var c = await _db.Clinics.FirstOrDefaultAsync(x => x.Id == r.Id, ct)
                ?? throw new NotFoundException("Clinic", r.Id);
        _db.Clinics.Remove(c);
        await _db.SaveChangesAsync(ct);
    }
}