using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.CommissionOverrides.Queries.GetCommissionOverrides;

public class GetCommissionOverridesQueryHandler : IRequestHandler<GetCommissionOverridesQuery, PagedResult<CommissionOverrideDto>>
{
    private readonly IApplicationDbContext _db;

    public GetCommissionOverridesQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<CommissionOverrideDto>> Handle(GetCommissionOverridesQuery request, CancellationToken cancellationToken)
    {
        var query = _db.CommissionOverrides.Include(c => c.Test).AsQueryable();

        // Filter on the native enum column directly (enum == enum), never
        // c.EntityType.ToString() == someString — that gets translated to SQL
        // and breaks native Postgres enums ("operator does not exist" errors,
        // the same bug already hit in GetTechniciansQueryHandler).
        if (!string.IsNullOrWhiteSpace(request.EntityType) &&
            Enum.TryParse<CommissionEntityType>(request.EntityType, out var entityTypeEnum))
        {
            query = query.Where(c => c.EntityType == entityTypeEnum);
        }

        if (request.EntityId.HasValue)
        {
            var id = request.EntityId.Value;
            query = query.Where(c => c.DoctorId == id || c.ReferralId == id || c.TechnicianId == id);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        // Materialize FIRST — then do .ToString() / derived mapping in memory
        // (LINQ-to-Objects), never inside a .Select() that runs before ToListAsync().
        var overrideEntities = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        // ---------- Batch-fetch entity names (Doctor/Referral/Technician) ----------
        // One targeted query per entity type against only the IDs we actually need,
        // then a Dictionary for O(1) lookup while mapping — same batch-fetch +
        // Dictionary pattern used elsewhere (Commission Payout dedup) to avoid N+1.
        var doctorIds = overrideEntities.Where(o => o.DoctorId.HasValue).Select(o => o.DoctorId!.Value).Distinct().ToList();
        var referralIds = overrideEntities.Where(o => o.ReferralId.HasValue).Select(o => o.ReferralId!.Value).Distinct().ToList();
        var technicianIds = overrideEntities.Where(o => o.TechnicianId.HasValue).Select(o => o.TechnicianId!.Value).Distinct().ToList();

        var doctorNames = doctorIds.Count == 0
            ? new Dictionary<Guid, string>()
            : await _db.Doctors.Where(d => doctorIds.Contains(d.Id))
                .ToDictionaryAsync(d => d.Id, d => d.FullName, cancellationToken);

        var referralNames = referralIds.Count == 0
            ? new Dictionary<Guid, string>()
            : await _db.Referrals.Where(r => referralIds.Contains(r.Id))
                .ToDictionaryAsync(r => r.Id, r => r.FullName, cancellationToken);

        var technicianNames = technicianIds.Count == 0
            ? new Dictionary<Guid, string>()
            : await _db.Technicians.Where(t => technicianIds.Contains(t.Id))
                .ToDictionaryAsync(t => t.Id, t => t.FullName, cancellationToken);

        var overrides = overrideEntities.Select(c =>
        {
            var entityId = (c.DoctorId ?? c.ReferralId ?? c.TechnicianId)!.Value;
            var entityName = c.EntityType switch
            {
                CommissionEntityType.Doctor => doctorNames.GetValueOrDefault(entityId, "Unknown"),
                CommissionEntityType.Referral => referralNames.GetValueOrDefault(entityId, "Unknown"),
                CommissionEntityType.Technician => technicianNames.GetValueOrDefault(entityId, "Unknown"),
                _ => "Unknown"
            };

            return new CommissionOverrideDto
            {
                Id = c.Id,
                EntityType = c.EntityType.ToString(),
                EntityId = entityId,
                EntityName = entityName,
                TestId = c.TestId,
                TestName = c.Test.Name,
                CommissionType = c.CommissionType.ToString(),
                CommissionValue = c.CommissionValue
            };
        }).ToList();

        return new PagedResult<CommissionOverrideDto>
        {
            Items = overrides,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}