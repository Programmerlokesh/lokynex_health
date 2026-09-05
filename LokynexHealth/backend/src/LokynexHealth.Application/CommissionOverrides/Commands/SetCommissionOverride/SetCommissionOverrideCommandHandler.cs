using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.CommissionOverrides.Commands.SetCommissionOverride;

public class SetCommissionOverrideCommandHandler : IRequestHandler<SetCommissionOverrideCommand, Guid>
{
    private readonly IApplicationDbContext _db;

    public SetCommissionOverrideCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Guid> Handle(SetCommissionOverrideCommand request, CancellationToken cancellationToken)
    {
        var entityType = Enum.Parse<CommissionEntityType>(request.EntityType);

        // ---------- 1. Discriminator-based existence check ----------
        // Instead of loading all three tables "just in case", we branch ONCE
        // on entity type and query ONLY the relevant table — O(1) targeted lookup,
        // not O(3) wasted queries against tables we don't need.
        var entityExists = entityType switch
        {
            CommissionEntityType.Doctor => await _db.Doctors.AnyAsync(d => d.Id == request.EntityId, cancellationToken),
            CommissionEntityType.Referral => await _db.Referrals.AnyAsync(r => r.Id == request.EntityId, cancellationToken),
            CommissionEntityType.Technician => await _db.Technicians.AnyAsync(t => t.Id == request.EntityId, cancellationToken),
            _ => false
        };

        if (!entityExists)
            throw new NotFoundException(request.EntityType, request.EntityId);

        var testExists = await _db.Tests.AnyAsync(t => t.Id == request.TestId, cancellationToken);
        if (!testExists)
            throw new NotFoundException(nameof(Test), request.TestId);

        // ---------- 2. Upsert pattern — find existing override first, avoid duplicate rows ----------
        // Mirrors the DB's partial unique index (Section 2): at most one override per
        // (entity, test) pair. We look it up first so re-setting the same entity+test
        // updates in place instead of violating the unique constraint on insert.
        CommissionOverride? existing = entityType switch
        {
            CommissionEntityType.Doctor => await _db.CommissionOverrides
                .FirstOrDefaultAsync(c => c.DoctorId == request.EntityId && c.TestId == request.TestId, cancellationToken),
            CommissionEntityType.Referral => await _db.CommissionOverrides
                .FirstOrDefaultAsync(c => c.ReferralId == request.EntityId && c.TestId == request.TestId, cancellationToken),
            CommissionEntityType.Technician => await _db.CommissionOverrides
                .FirstOrDefaultAsync(c => c.TechnicianId == request.EntityId && c.TestId == request.TestId, cancellationToken),
            _ => null
        };

        var commissionType = Enum.Parse<CommissionType>(request.CommissionType);

        if (existing is not null)
        {
            existing.CommissionType = commissionType;
            existing.CommissionValue = request.CommissionValue;
            await _db.SaveChangesAsync(cancellationToken);
            return existing.Id;
        }

        // ---------- 3. Build the override row — exactly one FK column populated ----------
        var overrideEntity = new CommissionOverride
        {
            Id = Guid.NewGuid(),
            EntityType = entityType,
            TestId = request.TestId,
            CommissionType = commissionType,
            CommissionValue = request.CommissionValue,
            CreatedAt = DateTimeOffset.UtcNow,

            DoctorId = entityType == CommissionEntityType.Doctor ? request.EntityId : null,
            ReferralId = entityType == CommissionEntityType.Referral ? request.EntityId : null,
            TechnicianId = entityType == CommissionEntityType.Technician ? request.EntityId : null
        };

        _db.CommissionOverrides.Add(overrideEntity);
        await _db.SaveChangesAsync(cancellationToken);

        return overrideEntity.Id;
    }
}