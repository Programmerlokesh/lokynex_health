using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Notifications.Queries.GetMyNotifications;

public class GetMyNotificationsQueryHandler : IRequestHandler<GetMyNotificationsQuery, MyNotificationsDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetMyNotificationsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<MyNotificationsDto> Handle(GetMyNotificationsQuery request, CancellationToken cancellationToken)
    {
        // Scope comes from the JWT, never from the request.
        var tenantId = _currentUser.TenantId;
        if (tenantId is null)
            throw new UnauthorizedException("This account is not linked to a lab.");

        // This lab's own messages + broadcasts (TenantId == null).
        var mine = _db.Notifications
            .AsNoTracking()
            .Where(n => n.TenantId == tenantId.Value || n.TenantId == null);

        // The badge counts every unread message, regardless of Take / UnreadOnly.
        var unreadCount = await mine.CountAsync(n => !n.IsRead, cancellationToken);

        var listQuery = request.UnreadOnly ? mine.Where(n => !n.IsRead) : mine;
        var take = Math.Clamp(request.Take, 1, 100);

        var items = await listQuery
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

        return new MyNotificationsDto { UnreadCount = unreadCount, Items = items };
    }
}