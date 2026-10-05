using LokynexHealth.Application.Common;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Orders.Queries.GetOrders;

/// <summary>
/// Filters of the Order List screen. Used by the list AND by the PDF export, so the
/// downloaded report always contains exactly the rows the user is looking at.
/// </summary>
public class OrderFilterCriteria
{
    public DateOnly? DateFrom { get; set; }
    public DateOnly? DateTo { get; set; }

    /// <summary>Minutes east of UTC of the user's browser (IST = 330). Dates are "calendar days" for the user.</summary>
    public int TzOffsetMinutes { get; set; } = 330;

    public Guid? BranchId { get; set; }
    public string? PaymentStatus { get; set; }   // Any | Open | Partial | Paid
    public string? PaymentMethod { get; set; }   // Any | Cash | Card | UPI
    public Guid? DepartmentId { get; set; }
    public Guid? TestId { get; set; }

    /// <summary>One box: digits => phone prefix, text => patient / family-member name.</summary>
    public string? Search { get; set; }
    public string? PatientNameContains { get; set; }
    public string? PatientPhone { get; set; }
    public string? OrderNumber { get; set; }

    public Guid? DoctorId { get; set; }
    public Guid? ReferralId { get; set; }
    public Guid? TechnicianId { get; set; }

    /// <summary>false = normal list, true = Deleted List.</summary>
    public bool ShowDeleted { get; set; }

    public IQueryable<Order> Apply(IQueryable<Order> query)
    {
        // Most selective + indexed condition first (partial indexes cover both values).
        query = query.Where(o => o.IsDeleted == ShowDeleted);

        if (BranchId.HasValue) query = query.Where(o => o.BranchId == BranchId.Value);
        if (DoctorId.HasValue) query = query.Where(o => o.DoctorId == DoctorId.Value);
        if (ReferralId.HasValue) query = query.Where(o => o.ReferralId == ReferralId.Value);

        if (!string.IsNullOrWhiteSpace(OrderNumber))
        {
            var like = $"%{SqlLike.Escape(OrderNumber.Trim())}%";
            query = query.Where(o => EF.Functions.ILike(o.OrderNumber, like));
        }

        if (!string.IsNullOrWhiteSpace(PatientPhone))
        {
            var digits = PhoneNormalizer.Normalize(PatientPhone);
            query = query.Where(o => o.Patient.Phone == digits);
        }

        if (!string.IsNullOrWhiteSpace(PatientNameContains))
            query = query.Where(NameMatch($"%{SqlLike.Escape(PatientNameContains.Trim())}%"));

        if (!string.IsNullOrWhiteSpace(Search))
        {
            var term = Search.Trim();
            var digits = PhoneNormalizer.Normalize(term);
            var looksLikePhone = digits.Length >= 3 && term.All(c => char.IsDigit(c) || c is '+' or ' ' or '-' or '(' or ')');
            if (looksLikePhone)
            {
                var prefix = SqlLike.Escape(digits) + "%";
                query = query.Where(o => EF.Functions.Like(o.Patient.Phone, prefix));
            }
            else
            {
                query = query.Where(NameMatch($"%{SqlLike.Escape(term)}%"));
            }
        }

        if (!string.IsNullOrWhiteSpace(PaymentStatus) && !PaymentStatus.Equals("Any", StringComparison.OrdinalIgnoreCase)
            && Enum.TryParse<PaymentStatusType>(PaymentStatus, true, out var status))
            query = query.Where(o => o.PaymentStatus == status);

        // Payment method = "the order has a payment taken with this method" (split payments count).
        if (!string.IsNullOrWhiteSpace(PaymentMethod) && !PaymentMethod.Equals("Any", StringComparison.OrdinalIgnoreCase)
            && Enum.TryParse<PaymentMethodType>(PaymentMethod, true, out var method))
            query = query.Where(o => o.Payments.Any(p => p.PaymentMethod == method));

        // Date range: [from 00:00, to+1 00:00) in the user's own time zone, compared in UTC.
        var offset = TimeSpan.FromMinutes(Math.Clamp(TzOffsetMinutes, -840, 840));
        if (DateFrom.HasValue)
        {
            var from = new DateTimeOffset(DateFrom.Value.ToDateTime(TimeOnly.MinValue), offset).ToUniversalTime();
            query = query.Where(o => o.CreatedAt >= from);
        }
        if (DateTo.HasValue)
        {
            var to = new DateTimeOffset(DateTo.Value.AddDays(1).ToDateTime(TimeOnly.MinValue), offset).ToUniversalTime();
            query = query.Where(o => o.CreatedAt < to);
        }

        // EXISTS sub-queries (never a join) so multi-test orders can't duplicate rows.
        if (TestId.HasValue) query = query.Where(o => o.Items.Any(i => i.TestId == TestId.Value));
        if (DepartmentId.HasValue) query = query.Where(o => o.Items.Any(i => i.Test.DepartmentId == DepartmentId.Value));
        if (TechnicianId.HasValue) query = query.Where(o => o.Items.Any(i => i.TechnicianId == TechnicianId.Value));

        return query;
    }

    // Person the order is for: the family member if there is one, otherwise the guardian.
    private static System.Linq.Expressions.Expression<Func<Order, bool>> NameMatch(string like) =>
        o => (o.Relative != null && EF.Functions.ILike(o.Relative.Name, like))
             || EF.Functions.ILike(o.Patient.FullName, like);
}