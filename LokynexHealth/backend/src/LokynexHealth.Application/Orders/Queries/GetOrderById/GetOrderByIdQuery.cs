using MediatR;

namespace LokynexHealth.Application.Orders.Queries.GetOrderById;

public class GetOrderByIdQuery : IRequest<OrderInvoiceDto>
{
    public Guid Id { get; set; }
}