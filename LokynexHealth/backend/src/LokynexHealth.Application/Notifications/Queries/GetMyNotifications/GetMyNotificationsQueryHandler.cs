using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Notifications.Queries.GetMyNotifications;

public class GetMyNotificationsQueryHandler
    : IRequestHandler<GetMyNotificationsQuery, MyNotificationsDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetMyNotificationsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<MyNotificationsDto> Handle(
        GetMyNotificationsQuery request,
        CancellationToken cancellationToken)
    {
        var tenantId = _currentUser.TenantId;

        if (tenantId is null)
            throw new UnauthorizedException("This account is not linked to a lab.");

        // A lab's inbox = messages addressed to it + platform-wide broadcasts.
        // The tenant filter is applied here rather than trusted from the caller,
        // so no lab can read another lab's renewal notices.
        var query = _db.Notifications
            .Where(n => n.TenantId == tenantId.Value || n.TenantId == null);

        if (request.UnreadOnly)
            query = query.Where(n => !n.IsRead);

        var take = Math.Clamp(request.Take, 1, 200);

        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(take)
            .Select(n => new MyNotificationItemDto
            {
                Id = n.Id,
                Title = n.Title,
                Message = n.Message,
                IsRead = n.IsRead,
                IsBroadcast = n.TenantId == null,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var unreadCount = await _db.Notifications
            .CountAsync(
                n => (n.TenantId == tenantId.Value || n.TenantId == null) && !n.IsRead,
                cancellationToken);

        return new MyNotificationsDto { UnreadCount = unreadCount, Items = items };
    }
}