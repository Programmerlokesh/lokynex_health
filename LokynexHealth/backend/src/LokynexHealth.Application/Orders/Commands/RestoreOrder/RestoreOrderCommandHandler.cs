using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Orders.Common;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Orders.Commands.RestoreOrder;

public class RestoreOrderCommandHandler : IRequestHandler<RestoreOrderCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public RestoreOrderCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(RestoreOrderCommand request, CancellationToken ct)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == request.Id, ct)
                    ?? throw new NotFoundException(nameof(Order), request.Id);

        if (!order.IsDeleted)
            throw new ConflictException("Order is not deleted.");

        var now = DateTimeOffset.UtcNow;
        var actor = await OrderActorResolver.ResolveAsync(_db, _currentUser, ct);

        order.IsDeleted = false;
        order.DeletedAt = null;
        order.DeletedBy = null;
        order.DeletedByName = null;
        order.UpdatedAt = now;
        order.UpdatedBy = actor.UserId;
        order.UpdatedByName = actor.Name;

        _db.OrderAuditLogs.Add(OrderAudit.Entry(order.Id, "Restore", actor, now, "Order restored"));
        await _db.SaveChangesAsync(ct);
    }
}