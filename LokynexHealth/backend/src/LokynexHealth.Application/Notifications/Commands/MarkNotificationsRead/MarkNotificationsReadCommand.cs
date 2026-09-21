using MediatR;

namespace LokynexHealth.Application.Notifications.Commands.MarkNotificationsRead;

public class MarkNotificationsReadCommand : IRequest<int>
{
    /// <summary>Empty = mark every notification in this lab's inbox as read.</summary>
    public List<Guid> NotificationIds { get; set; } = new();
}