using LokynexHealth.Application.Common.Models;
using MediatR;

namespace LokynexHealth.Application.CommissionOverrides.Queries.GetCommissionOverrides;

public class GetCommissionOverridesQuery : IRequest<PagedResult<CommissionOverrideDto>>
{
    public string? EntityType { get; set; }
    public Guid? EntityId { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}