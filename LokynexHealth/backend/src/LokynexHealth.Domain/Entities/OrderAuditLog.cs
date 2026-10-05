namespace LokynexHealth.Domain.Entities;

/// <summary>One edit / delete / restore of an order: who, when, what changed (order_audit_logs).</summary>
public class OrderAuditLog
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = default!;

    /// <summary>Null when the Lab Admin (who has no row in `users`) made the change.</summary>
    public Guid? ChangedBy { get; set; }
    public string? ChangedByName { get; set; }
    public DateTimeOffset ChangedAt { get; set; }

    /// <summary>"Edit" | "Delete" | "Restore".</summary>
    public string Action { get; set; } = "Edit";
    public string? ChangeSummary { get; set; }

    /// <summary>JSON snapshot before / after the change (jsonb).</summary>
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
}