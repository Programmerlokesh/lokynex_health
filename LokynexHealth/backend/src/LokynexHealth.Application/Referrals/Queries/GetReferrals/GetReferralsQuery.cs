using LokynexHealth.Application.Common.Models;
using MediatR;

namespace LokynexHealth.Application.Referrals.Queries.GetReferrals;

public class GetReferralsQuery : IRequest<PagedResult<ReferralDto>>
{
    public string? Search { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}