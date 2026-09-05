using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Orders.Commands.DeleteOrder;

public class DeleteOrderCommandHandler : IRequestHandler<DeleteOrderCommand>
{
    private readonly IApplicationDbContext _db;

    public DeleteOrderCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(DeleteOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken);

        if (order is null)
            throw new NotFoundException(nameof(Order), request.Id);

        if (order.IsDeleted)
            throw new ConflictException("Order is already deleted.");

        order.IsDeleted = true;
        order.DeletedAt = DateTimeOffset.UtcNow;
        order.DeletedBy = request.DeletedBy;

        await _db.SaveChangesAsync(cancellationToken);
    }
}