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

        if (!string.IsNullOrWhiteSpace(request.EntityType) &&
            Enum.TryParse<CommissionEntityType>(request.EntityType, out var entityTypeEnum))
        {
            var typeText = entityTypeEnum.ToString();
            query = query.Where(c => c.EntityType.ToString() == typeText);
        }

        if (request.EntityId.HasValue)
        {
            var id = request.EntityId.Value;
            query = query.Where(c => c.DoctorId == id || c.ReferralId == id || c.TechnicianId == id);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var overrides = await query
            .OrderBy(c => c.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(c => new CommissionOverrideDto
            {
                Id = c.Id,
                EntityType = c.EntityType.ToString(),
                EntityId = (c.DoctorId ?? c.ReferralId ?? c.TechnicianId)!.Value,
                TestId = c.TestId,
                TestName = c.Test.Name,
                CommissionType = c.CommissionType.ToString(),
                CommissionValue = c.CommissionValue
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<CommissionOverrideDto>
        {
            Items = overrides,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}