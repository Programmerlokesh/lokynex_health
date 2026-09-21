using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Application.Labs.Common;

/// <summary>
/// A lab's current subscription, flattened for the SuperAdmin console.
/// </summary>
public class LabSubscriptionSummary
{
    public Guid SubscriptionId { get; set; }
    public string PlanName { get; set; } = default!;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public decimal AmountPaid { get; set; }
    public bool AutoRenew { get; set; }

    /// <summary>Status as stored in the database.</summary>
    public string StoredStatus { get; set; } = default!;

    /// <summary>
    /// Status after comparing EndDate with today. A row can sit in the database
    /// as 'Active' long after it lapsed because nothing rewrites it on a
    /// schedule — so this, not StoredStatus, is what the UI should show.
    /// </summary>
    public string EffectiveStatus { get; set; } = default!;

    /// <summary>Negative once the subscription has lapsed.</summary>
    public int DaysRemaining { get; set; }

    public bool IsExpired { get; set; }

    /// <summary>Still valid, but inside the renewal window.</summary>
    public bool IsExpiringSoon { get; set; }
}

public static class LabSubscriptionCalculator
{
    /// <summary>Days before expiry at which a lab counts as "expiring soon".</summary>
    public const int ExpiringSoonThresholdDays = 15;

    /// <summary>
    /// Picks the subscription that actually governs the lab right now: the one
    /// with the latest EndDate, NOT the most recently created. A back-dated
    /// correction entered after a renewal must not be allowed to override the
    /// renewal itself.
    /// </summary>
    public static LabSubscriptionSummary? Build(
        IEnumerable<Subscription> subscriptions,
        IReadOnlyDictionary<Guid, string> planNamesById,
        DateOnly today)
    {
        var current = subscriptions
            .Where(s => s.Status != SubscriptionStatusType.Cancelled)
            .OrderByDescending(s => s.EndDate)
            .FirstOrDefault()
            ?? subscriptions.OrderByDescending(s => s.EndDate).FirstOrDefault();

        if (current is null)
            return null;

        var daysRemaining = current.EndDate.DayNumber - today.DayNumber;
        var isExpired = daysRemaining < 0;

        var effectiveStatus = current.Status switch
        {
            SubscriptionStatusType.Cancelled => nameof(SubscriptionStatusType.Cancelled),
            _ when isExpired => nameof(SubscriptionStatusType.Expired),
            SubscriptionStatusType.Trial => nameof(SubscriptionStatusType.Trial),
            _ => nameof(SubscriptionStatusType.Active)
        };

        return new LabSubscriptionSummary
        {
            SubscriptionId = current.Id,
            PlanName = planNamesById.TryGetValue(current.PlanId, out var planName) ? planName : "—",
            StartDate = current.StartDate,
            EndDate = current.EndDate,
            AmountPaid = current.AmountPaid,
            AutoRenew = current.AutoRenew,
            StoredStatus = current.Status.ToString(),
            EffectiveStatus = effectiveStatus,
            DaysRemaining = daysRemaining,
            IsExpired = isExpired,
            IsExpiringSoon = !isExpired && daysRemaining <= ExpiringSoonThresholdDays
        };
    }
}