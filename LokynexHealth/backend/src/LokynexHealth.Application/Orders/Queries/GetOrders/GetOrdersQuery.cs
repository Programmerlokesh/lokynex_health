using LokynexHealth.Application.Common.Models;
using MediatR;

namespace LokynexHealth.Application.Orders.Queries.GetOrders;

public class GetOrdersQuery : OrderFilterCriteria, IRequest<PagedResult<OrderDto>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}