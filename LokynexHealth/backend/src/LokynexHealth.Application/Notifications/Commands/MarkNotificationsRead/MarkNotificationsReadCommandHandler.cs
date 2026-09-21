using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Notifications.Commands.MarkNotificationsRead;

public class MarkNotificationsReadCommandHandler
    : IRequestHandler<MarkNotificationsReadCommand, int>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public MarkNotificationsReadCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<int> Handle(MarkNotificationsReadCommand request, CancellationToken cancellationToken)
    {
        var tenantId = _currentUser.TenantId;

        if (tenantId is null)
            throw new UnauthorizedException("This account is not linked to a lab.");

        var query = _db.Notifications
            .Where(n => (n.TenantId == tenantId.Value || n.TenantId == null) && !n.IsRead);

        if (request.NotificationIds.Count > 0)
            query = query.Where(n => request.NotificationIds.Contains(n.Id));

        var rows = await query.ToListAsync(cancellationToken);

        foreach (var notification in rows)
            notification.IsRead = true;

        await _db.SaveChangesAsync(cancellationToken);
        return rows.Count;
    }
}