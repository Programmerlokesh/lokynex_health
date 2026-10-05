using LokynexHealth.Application.Orders.Commands.CreateOrder;
using LokynexHealth.Application.Orders.Commands.DeleteOrder;
using LokynexHealth.Application.Orders.Commands.RestoreOrder;
using LokynexHealth.Application.Orders.Commands.UpdateOrder;
using LokynexHealth.Application.Orders.Queries.ExportOrders;
using LokynexHealth.Application.Orders.Queries.GetOrderById;
using LokynexHealth.Application.Orders.Queries.GetOrderForEdit;
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

    public OrdersController(IMediator mediator) => _mediator = mediator;

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderCommand command, CancellationToken ct)
    {
        var id = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetOrderById), new { id }, new { id });
    }

    /// <summary>Order List: every filter of the screen (date range, branch, payment method/status, search...).</summary>
    [HttpGet]
    public async Task<IActionResult> GetOrders([FromQuery] GetOrdersQuery query, CancellationToken ct) =>
        Ok(await _mediator.Send(query, ct));

    /// <summary>Same filters, no paging — data for the "Download PDF" report.</summary>
    [HttpGet("export")]
    public async Task<IActionResult> ExportOrders([FromQuery] ExportOrdersQuery query, CancellationToken ct) =>
        Ok(await _mediator.Send(query, ct));

    /// <summary>Order details + invoice payload (company, patient, lines, payments, history).</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetOrderById(Guid id, CancellationToken ct) =>
        Ok(await _mediator.Send(new GetOrderByIdQuery { Id = id }, ct));

    /// <summary>The order in the shape of the New-Order form, to pre-fill the edit screen.</summary>
    [HttpGet("{id:guid}/edit")]
    public async Task<IActionResult> GetOrderForEdit(Guid id, CancellationToken ct) =>
        Ok(await _mediator.Send(new GetOrderForEditQuery { Id = id }, ct));

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateOrder(Guid id, [FromBody] UpdateOrderCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    /// <summary>Soft delete: moves the order to the Deleted List.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteOrder(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteOrderCommand { Id = id }, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/restore")]
    public async Task<IActionResult> RestoreOrder(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new RestoreOrderCommand { Id = id }, ct);
        return NoContent();
    }
}