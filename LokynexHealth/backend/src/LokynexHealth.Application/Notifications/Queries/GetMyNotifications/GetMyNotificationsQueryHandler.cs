using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Notifications.Queries.GetNotifications;

public class GetNotificationsQueryHandler : IRequestHandler<GetNotificationsQuery, List<NotificationDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;

    public GetNotificationsQueryHandler(IApplicationDbContext db, ICurrentUserService user)
    {
        _db = db;
        _user = user;
    }

    public async Task<List<NotificationDto>> Handle(GetNotificationsQuery request, CancellationToken cancellationToken)
    {
        var query = _db.Notifications.AsQueryable();

        // Staff only see notifications sent to labs they added (never broadcasts).
        var scope = await OwnerAccess.ScopedTenantIdsAsync(_db, _user, cancellationToken);
        if (scope is not null)
            query = query.Where(n => n.TenantId != null && scope.Contains(n.TenantId.Value));

        if (request.TenantId.HasValue)
            query = query.Where(n => n.TenantId == null || n.TenantId == request.TenantId.Value);

        return await query
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                TenantId = n.TenantId,
                Title = n.Title,
                Message = n.Message,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync(cancellationToken);
    }
}