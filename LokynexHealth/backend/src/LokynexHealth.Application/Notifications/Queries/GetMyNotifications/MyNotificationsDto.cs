namespace LokynexHealth.Application.Notifications.Queries.GetMyNotifications;

public class MyNotificationsDto
{
    public int UnreadCount { get; set; }
    public List<MyNotificationItemDto> Items { get; set; } = new();
}

public class MyNotificationItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = default!;
    public string Message { get; set; } = default!;
    public bool IsRead { get; set; }

    /// <summary>True when this went to every lab rather than this one specifically.</summary>
    public bool IsBroadcast { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}