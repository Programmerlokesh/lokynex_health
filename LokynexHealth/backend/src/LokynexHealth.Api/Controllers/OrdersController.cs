using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Orders.Commands.CreateOrder;
using LokynexHealth.Application.Orders.Commands.DeleteOrder;
using LokynexHealth.Application.Orders.Queries.GetOrders;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public OrdersController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderCommand command, CancellationToken ct)
    {
        var id = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(CreateOrder), new { id }, new { id });
    }

    [HttpGet]
    public async Task<IActionResult> GetOrders([FromQuery] GetOrdersQuery query, CancellationToken ct)
    {
        var result = await _mediator.Send(query, ct);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteOrder(Guid id, CancellationToken ct)
    {
        var command = new DeleteOrderCommand { Id = id, DeletedBy = _currentUser.UserId ?? Guid.Empty };
        await _mediator.Send(command, ct);
        return NoContent();
    }
}