using MediatR;

namespace LokynexHealth.Application.Orders.Commands.DeleteOrder;

public class DeleteOrderCommand : IRequest
{
    public Guid Id { get; set; }
    public Guid DeletedBy { get; set; }
}