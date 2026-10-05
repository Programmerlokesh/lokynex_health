using LokynexHealth.Application.Orders.Common;
using MediatR;

namespace LokynexHealth.Application.Orders.Commands.CreateOrder;

/// <summary>All form fields live in <see cref="OrderInput"/>, shared with UpdateOrderCommand.</summary>
public class CreateOrderCommand : OrderInput, IRequest<Guid>
{
}