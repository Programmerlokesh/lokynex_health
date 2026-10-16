using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using LokynexHealth.Domain.Enums;
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
        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 200);

        var query = _db.Referrals.AsNoTracking().AsQueryable();

        if (Enum.TryParse<PlatformRecordStatus>(request.Status, true, out var status))
            query = query.Where(r => r.Status == status);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = $"%{request.Search}%";
            var phonePattern = PhoneNormalizer.FormatInsensitiveLikePattern(request.Search);

            query = query.Where(r =>
                EF.Functions.ILike(r.FullName, term) ||
                (r.Email != null && EF.Functions.ILike(r.Email, term)) ||
                EF.Functions.ILike(r.Phone, term) ||
                (phonePattern != null && EF.Functions.Like(r.Phone, phonePattern)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var referralEntities = await query
            .OrderBy(r => r.FullName)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var referrals = referralEntities.Select(r => new ReferralDto
        {
            Id = r.Id,
            FullName = r.FullName,
            Phone = r.Phone,
            WhatsappNumber = r.WhatsappNumber,
            Email = r.Email,
            Address = r.Address,
            Status = r.Status.ToString()
        }).ToList();

        return new PagedResult<ReferralDto>
        {
            Items = referrals,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }
}