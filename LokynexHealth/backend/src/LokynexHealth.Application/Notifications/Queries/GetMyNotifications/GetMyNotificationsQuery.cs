using MediatR;

namespace LokynexHealth.Application.Notifications.Queries.GetMyNotifications;

public class GetMyNotificationsQuery : IRequest<MyNotificationsDto>
{
    public bool UnreadOnly { get; set; }
    public int Take { get; set; } = 50;
}