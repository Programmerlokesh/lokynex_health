using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Orders.Common;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Orders.Commands.DeleteOrder;

public class DeleteOrderCommandHandler : IRequestHandler<DeleteOrderCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public DeleteOrderCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(DeleteOrderCommand request, CancellationToken ct)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == request.Id, ct)
                    ?? throw new NotFoundException(nameof(Order), request.Id);

        if (order.IsDeleted)
            throw new ConflictException("Order is already deleted.");

        var now = DateTimeOffset.UtcNow;
        var actor = await OrderActorResolver.ResolveAsync(_db, _currentUser, ct);

        order.IsDeleted = true;
        order.DeletedAt = now;
        order.DeletedBy = actor.UserId;
        order.DeletedByName = actor.Name;

        _db.OrderAuditLogs.Add(OrderAudit.Entry(order.Id, "Delete", actor, now, "Order deleted"));
        await OrderLedger.RemoveAsync(_db, order.Id, ct);

        await _db.SaveChangesAsync(ct);
    }
}