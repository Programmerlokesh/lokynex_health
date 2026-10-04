using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.CommissionOverrides.Queries.GetEffectiveCommissions;

public class GetEffectiveCommissionsQueryHandler
    : IRequestHandler<GetEffectiveCommissionsQuery, List<EffectiveCommissionDto>>
{
    private readonly IApplicationDbContext _db;

    public GetEffectiveCommissionsQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<EffectiveCommissionDto>> Handle(
        GetEffectiveCommissionsQuery request, CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<CommissionEntityType>(request.EntityType, out var entityType))
            throw new ConflictException("EntityType must be Doctor, Referral or Technician.");

        var departmentExists = await _db.Departments.AnyAsync(d => d.Id == request.DepartmentId, cancellationToken);
        if (!departmentExists) throw new NotFoundException(nameof(Department), request.DepartmentId);

        var tests = await _db.Tests
            .Where(t => t.DepartmentId == request.DepartmentId)
            .OrderBy(t => t.Name)
            .ToListAsync(cancellationToken);

        var testIds = tests.Select(t => t.Id).ToList();
        var id = request.EntityId;

        var overrideQuery = _db.CommissionOverrides.Where(c => testIds.Contains(c.TestId));
        overrideQuery = entityType switch
        {
            CommissionEntityType.Doctor => overrideQuery.Where(c => c.DoctorId == id),
            CommissionEntityType.Referral => overrideQuery.Where(c => c.ReferralId == id),
            _ => overrideQuery.Where(c => c.TechnicianId == id)
        };
        var overrides = (await overrideQuery.ToListAsync(cancellationToken)).ToDictionary(c => c.TestId);

        return tests.Select(t =>
        {
            var (defType, defValue) = entityType switch
            {
                CommissionEntityType.Doctor => (t.DoctorCommissionType, t.DoctorCommissionValue),
                CommissionEntityType.Referral => (t.ReferralCommissionType, t.ReferralCommissionValue),
                _ => (t.TechnicianCommissionType, t.TechnicianCommissionValue)
            };

            var hasOverride = overrides.TryGetValue(t.Id, out var o);
            return new EffectiveCommissionDto
            {
                TestId = t.Id,
                TestName = t.Name,
                Price = t.Price,
                TestStatus = t.Status.ToString(),
                DefaultCommissionType = defType.ToString(),
                DefaultCommissionValue = defValue,
                HasOverride = hasOverride,
                CommissionType = (hasOverride ? o!.CommissionType : defType).ToString(),
                CommissionValue = hasOverride ? o!.CommissionValue : defValue
            };
        }).ToList();
    }
}