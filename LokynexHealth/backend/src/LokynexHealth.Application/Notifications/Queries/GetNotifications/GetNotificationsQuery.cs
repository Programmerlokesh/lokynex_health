using MediatR;

namespace LokynexHealth.Application.Notifications.Queries.GetNotifications;

public class GetNotificationsQuery : IRequest<List<NotificationDto>>
{
    public Guid? TenantId { get; set; }   // fetch broadcast + tenant-specific for this tenant
}