using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Referrals.Queries.GetReferrals;

public class GetReferralsQueryHandler : IRequestHandler<GetReferralsQuery, PagedResult<ReferralDto>>
{
    private readonly IApplicationDbContext _db;

    public GetReferralsQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<ReferralDto>> Handle(GetReferralsQuery request, CancellationToken cancellationToken)
    {
        var query = _db.Referrals.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = $"%{request.Search}%";
            query = query.Where(r =>
                EF.Functions.ILike(r.FullName, term) ||
                (r.Email != null && EF.Functions.ILike(r.Email, term)) ||
                EF.Functions.ILike(r.Phone, term));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var referralEntities = await query
            .OrderBy(r => r.FullName)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var referrals = referralEntities.Select(r => new ReferralDto
        {
            Id = r.Id,
            FullName = r.FullName,
            Phone = r.Phone,
            Email = r.Email,
            Address = r.Address,
            Status = r.Status.ToString()
        }).ToList();

        return new PagedResult<ReferralDto>
        {
            Items = referrals,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}