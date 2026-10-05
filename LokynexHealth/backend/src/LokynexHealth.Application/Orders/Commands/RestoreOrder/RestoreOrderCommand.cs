using MediatR;

namespace LokynexHealth.Application.Orders.Commands.RestoreOrder;

public class RestoreOrderCommand : IRequest
{
    public Guid Id { get; set; }
}