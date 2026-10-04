using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.CommissionOverrides.Commands.BulkSetCommissionOverrides;

public class BulkSetCommissionOverridesCommandHandler : IRequestHandler<BulkSetCommissionOverridesCommand, int>
{
    private readonly IApplicationDbContext _db;

    public BulkSetCommissionOverridesCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<int> Handle(BulkSetCommissionOverridesCommand request, CancellationToken cancellationToken)
    {
        var entityType = Enum.Parse<CommissionEntityType>(request.EntityType);
        var entityId = request.EntityId;

        var entityExists = entityType switch
        {
            CommissionEntityType.Doctor => await _db.Doctors.AnyAsync(d => d.Id == entityId, cancellationToken),
            CommissionEntityType.Referral => await _db.Referrals.AnyAsync(r => r.Id == entityId, cancellationToken),
            _ => await _db.Technicians.AnyAsync(t => t.Id == entityId, cancellationToken)
        };
        if (!entityExists) throw new NotFoundException(request.EntityType, entityId);

        // Only tests that really belong to the chosen department can be changed here.
        var deptTestIds = (await _db.Tests
                .Where(t => t.DepartmentId == request.DepartmentId)
                .Select(t => t.Id)
                .ToListAsync(cancellationToken))
            .ToHashSet();

        var foreign = request.Items.FirstOrDefault(i => !deptTestIds.Contains(i.TestId));
        if (foreign is not null) throw new NotFoundException(nameof(Test), foreign.TestId);

        var testIds = request.Items.Select(i => i.TestId).ToList();
        var query = _db.CommissionOverrides.Where(c => testIds.Contains(c.TestId));
        query = entityType switch
        {
            CommissionEntityType.Doctor => query.Where(c => c.DoctorId == entityId),
            CommissionEntityType.Referral => query.Where(c => c.ReferralId == entityId),
            _ => query.Where(c => c.TechnicianId == entityId)
        };
        var existing = (await query.ToListAsync(cancellationToken)).ToDictionary(c => c.TestId);

        var changed = 0;
        foreach (var item in request.Items)
        {
            existing.TryGetValue(item.TestId, out var row);

            if (item.Reset)
            {
                if (row is not null) { _db.CommissionOverrides.Remove(row); changed++; }
                continue;
            }

            var type = Enum.Parse<CommissionType>(item.CommissionType);
            if (row is not null)
            {
                if (row.CommissionType != type || row.CommissionValue != item.CommissionValue)
                {
                    row.CommissionType = type;
                    row.CommissionValue = item.CommissionValue;
                    row.DepartmentId = request.DepartmentId;
                    changed++;
                }
            }
            else
            {
                _db.CommissionOverrides.Add(new CommissionOverride
                {
                    Id = Guid.NewGuid(),
                    EntityType = entityType,
                    TestId = item.TestId,
                    DepartmentId = request.DepartmentId,
                    CommissionType = type,
                    CommissionValue = item.CommissionValue,
                    CreatedAt = DateTimeOffset.UtcNow,
                    DoctorId = entityType == CommissionEntityType.Doctor ? entityId : null,
                    ReferralId = entityType == CommissionEntityType.Referral ? entityId : null,
                    TechnicianId = entityType == CommissionEntityType.Technician ? entityId : null
                });
                changed++;
            }
        }

        if (changed > 0) await _db.SaveChangesAsync(cancellationToken);
        return changed;
    }
}