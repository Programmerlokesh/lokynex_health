using MediatR;

namespace LokynexHealth.Application.Notifications.Commands.SendNotification;

public class SendNotificationCommand : IRequest<Guid>
{
    public Guid? TenantId { get; set; }   // null = broadcast to all labs
    public string Title { get; set; } = default!;
    public string Message { get; set; } = default!;
    public Guid? SentBy { get; set; }
}