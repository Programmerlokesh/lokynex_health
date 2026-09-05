namespace LokynexHealth.Domain.Entities;

public class Notification
{
    public Guid Id { get; set; }
    public Guid? TenantId { get; set; }   // null = broadcast to all labs
    public string Title { get; set; } = default!;
    public string Message { get; set; } = default!;
    public Guid? SentBy { get; set; }
    public bool IsRead { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}