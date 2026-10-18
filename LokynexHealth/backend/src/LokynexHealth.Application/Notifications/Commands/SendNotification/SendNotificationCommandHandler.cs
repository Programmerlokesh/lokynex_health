using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using MediatR;

namespace LokynexHealth.Application.Notifications.Commands.SendNotification;

public class SendNotificationCommandHandler : IRequestHandler<SendNotificationCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;

    public SendNotificationCommandHandler(IApplicationDbContext db, ICurrentUserService user)
    {
        _db = db;
        _user = user;
    }

    public async Task<Guid> Handle(SendNotificationCommand request, CancellationToken cancellationToken)
    {
        var sentBy = request.SentBy;

        // Staff: no broadcast, and only to labs they added.
        var scope = await OwnerAccess.ScopedTenantIdsAsync(_db, _user, cancellationToken);
        if (scope is not null)
        {
            if (request.TenantId is null)
                throw new ConflictException("Choose one of the labs you added. Staff cannot send to all labs.");
            if (!scope.Contains(request.TenantId.Value))
                throw new NotFoundException(nameof(Tenant), request.TenantId.Value);
            sentBy = null; // SentBy points at super_admins; a staff id would break that link.
        }

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            TenantId = request.TenantId,
            Title = request.Title,
            Message = request.Message,
            SentBy = sentBy,
            IsRead = false,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync(cancellationToken);
        return notification.Id;
    }
}