using System.Text.Json;
using LokynexHealth.Domain.Entities;

namespace LokynexHealth.Application.Orders.Common;

public sealed record SnapLine(Guid TestId, decimal Price, Guid? TechnicianId);
public sealed record SnapPayment(string Method, decimal Amount);

/// <summary>Comparable picture of an order, stored as JSON in order_audit_logs.</summary>
public sealed record OrderSnapshot(
    Guid PatientId, Guid? RelativeId, Guid BranchId, Guid? DoctorId, Guid? ReferralId,
    string DiscountType, decimal DiscountValue, bool IsComplimentary,
    decimal Gross, decimal Final, decimal Paid,
    List<SnapLine> Items, List<SnapPayment> Payments);

public static class OrderAudit
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public static OrderSnapshot Snapshot(Order o) => new(
        o.PatientId, o.RelativeId, o.BranchId, o.DoctorId, o.ReferralId,
        o.DiscountType.ToString(), o.DiscountValue, o.IsComplimentary,
        o.GrossAmount, o.FinalAmount, o.PaidAmount,
        o.Items.OrderBy(i => i.TestId).Select(i => new SnapLine(i.TestId, i.Price, i.TechnicianId)).ToList(),
        o.Payments.GroupBy(p => p.PaymentMethod)
            .OrderBy(g => g.Key.ToString())
            .Select(g => new SnapPayment(g.Key.ToString(), g.Sum(p => p.Amount))).ToList());

    public static OrderAuditLog Entry(
        Guid orderId, string action, OrderActor actor, DateTimeOffset now, string? summary,
        OrderSnapshot? before = null, OrderSnapshot? after = null) => new()
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            Action = action,
            ChangedBy = actor.UserId,
            ChangedByName = actor.Name,
            ChangedAt = now,
            ChangeSummary = summary,
            OldValues = before is null ? null : JsonSerializer.Serialize(before, Json),
            NewValues = after is null ? null : JsonSerializer.Serialize(after, Json)
        };

    /// <summary>
    /// Human readable "what changed". Test lines are compared with HashSets, so the
    /// whole diff is O(n). Returns an empty string when nothing changed.
    /// </summary>
    public static string Diff(OrderSnapshot a, OrderSnapshot b, IReadOnlyDictionary<Guid, string> testNames)
    {
        var parts = new List<string>();
        string Name(Guid id) => testNames.TryGetValue(id, out var n) ? n : "test";

        if (a.PatientId != b.PatientId || a.RelativeId != b.RelativeId) parts.Add("Patient changed");
        if (a.BranchId != b.BranchId) parts.Add("Branch changed");
        if (a.DoctorId != b.DoctorId) parts.Add("Doctor changed");
        if (a.ReferralId != b.ReferralId) parts.Add("Referral changed");

        var before = a.Items.Select(i => i.TestId).ToHashSet();
        var after = b.Items.Select(i => i.TestId).ToHashSet();
        var added = after.Where(id => !before.Contains(id)).Select(Name).ToList();
        var removed = before.Where(id => !after.Contains(id)).Select(Name).ToList();
        if (added.Count > 0) parts.Add("Tests added: " + string.Join(", ", added));
        if (removed.Count > 0) parts.Add("Tests removed: " + string.Join(", ", removed));

        var oldTech = a.Items.ToDictionary(i => i.TestId, i => i.TechnicianId);
        if (b.Items.Any(i => oldTech.TryGetValue(i.TestId, out var t) && t != i.TechnicianId))
            parts.Add("Technician changed");

        if (a.IsComplimentary != b.IsComplimentary)
            parts.Add(b.IsComplimentary ? "Marked complimentary" : "Complimentary removed");
        if (a.DiscountType != b.DiscountType || a.DiscountValue != b.DiscountValue)
            parts.Add($"Discount {a.DiscountValue:0.##} ({a.DiscountType}) → {b.DiscountValue:0.##} ({b.DiscountType})");
        if (a.Final != b.Final) parts.Add($"Total {a.Final:0.00} → {b.Final:0.00}");
        if (a.Paid != b.Paid) parts.Add($"Paid {a.Paid:0.00} → {b.Paid:0.00}");

        var payA = a.Payments.ToDictionary(p => p.Method, p => p.Amount);
        var payB = b.Payments.ToDictionary(p => p.Method, p => p.Amount);
        if (payA.Count != payB.Count || payA.Any(kv => !payB.TryGetValue(kv.Key, out var v) || v != kv.Value))
            parts.Add("Payment methods changed");

        return string.Join("; ", parts);
    }
}