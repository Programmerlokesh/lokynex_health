namespace LokynexHealth.Application.Notifications.Queries.GetNotifications;

public class NotificationDto
{
    public Guid Id { get; set; }
    public Guid? TenantId { get; set; }
    public string Title { get; set; } = default!;
    public string Message { get; set; } = default!;
    public bool IsRead { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}