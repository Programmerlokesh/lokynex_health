using LokynexHealth.Application.Orders.Common;
using MediatR;

namespace LokynexHealth.Application.Orders.Commands.UpdateOrder;

/// <summary>Same fields as a new order. <see cref="Id"/> is taken from the route.</summary>
public class UpdateOrderCommand : OrderInput, IRequest
{
    public Guid Id { get; set; }
}