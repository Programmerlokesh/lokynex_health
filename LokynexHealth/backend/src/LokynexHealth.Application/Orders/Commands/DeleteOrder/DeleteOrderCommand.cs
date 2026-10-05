using MediatR;

namespace LokynexHealth.Application.Orders.Commands.DeleteOrder;

/// <summary>Soft delete: the order moves to the Deleted List and can be restored.</summary>
public class DeleteOrderCommand : IRequest
{
    public Guid Id { get; set; }
}