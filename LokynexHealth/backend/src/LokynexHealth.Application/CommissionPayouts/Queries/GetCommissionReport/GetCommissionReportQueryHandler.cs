using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Orders.Common;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.CommissionPayouts.Queries.GetCommissionReport;

public class GetCommissionReportQueryHandler : IRequestHandler<GetCommissionReportQuery, CommissionReportResult>
{
    public const int MaxRows = 5000;
    private readonly IApplicationDbContext _db;

    public GetCommissionReportQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<CommissionReportResult> Handle(GetCommissionReportQuery request, CancellationToken ct)
    {
        var type = Enum.TryParse<CommissionEntityType>(request.EntityType, true, out var t)
            ? t
            : CommissionEntityType.Referral;

        // ---------- 1. ONE filtered IQueryable (enum-to-enum compares only) ----------
        var query = _db.CommissionPayouts.AsNoTracking()
            .Where(p => p.EntityType == type && !p.OrderItem.Order.IsDeleted);

        // Date = ORDER date, as a calendar day in the user's own time zone.
        var offset = TimeSpan.FromMinutes(Math.Clamp(request.TzOffsetMinutes, -840, 840));
        if (request.DateFrom.HasValue)
        {
            var from = new DateTimeOffset(request.DateFrom.Value.ToDateTime(TimeOnly.MinValue), offset).ToUniversalTime();
            query = query.Where(p => p.OrderItem.Order.CreatedAt >= from);
        }
        if (request.DateTo.HasValue)
        {
            var to = new DateTimeOffset(request.DateTo.Value.AddDays(1).ToDateTime(TimeOnly.MinValue), offset).ToUniversalTime();
            query = query.Where(p => p.OrderItem.Order.CreatedAt < to);
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && !request.Status.Equals("All", StringComparison.OrdinalIgnoreCase)
            && Enum.TryParse<CommissionStatusType>(request.Status, true, out var statusEnum))
            query = query.Where(p => p.Status == statusEnum);

        if (request.EntityId.HasValue)
        {
            var id = request.EntityId.Value;
            query = type switch
            {
                CommissionEntityType.Doctor => query.Where(p => p.DoctorId == id),
                CommissionEntityType.Referral => query.Where(p => p.ReferralId == id),
                _ => query.Where(p => p.TechnicianId == id)
            };
        }

        // Phone / email / address belong to the doctor / referral / technician:
        // resolve the matching ids first (one small query), then filter payouts by them.
        var matchedIds = await MatchEntityIdsAsync(type, request, ct);
        if (matchedIds is not null)
        {
            query = type switch
            {
                CommissionEntityType.Doctor => query.Where(p => p.DoctorId != null && matchedIds.Contains(p.DoctorId.Value)),
                CommissionEntityType.Referral => query.Where(p => p.ReferralId != null && matchedIds.Contains(p.ReferralId.Value)),
                _ => query.Where(p => p.TechnicianId != null && matchedIds.Contains(p.TechnicianId.Value))
            };
        }

        // ---------- 2. Project everything the grid needs in one round trip ----------
        var raw = await query
            .OrderBy(p => p.OrderItem.Order.CreatedAt)
            .ThenBy(p => p.OrderItem.Order.OrderNumber)
            .ThenBy(p => p.OrderItemId)
            .Take(MaxRows + 1)
            .Select(p => new
            {
                p.Id,
                p.DoctorId,
                p.ReferralId,
                p.TechnicianId,
                p.CommissionAmount,
                p.Status,
                p.PaidAt,
                p.OrderItemId,
                OrderId = p.OrderItem.OrderId,
                OrderNumber = p.OrderItem.Order.OrderNumber,
                OrderDate = p.OrderItem.Order.CreatedAt,
                OrderDoctorId = p.OrderItem.Order.DoctorId,
                OrderReferralId = p.OrderItem.Order.ReferralId,
                PatientName = p.OrderItem.Order.Relative != null
                    ? p.OrderItem.Order.Relative.Name
                    : (p.OrderItem.Order.Patient.FullName != "" ? p.OrderItem.Order.Patient.FullName : p.OrderItem.Order.Patient.Phone),
                PatientPhone = p.OrderItem.Order.Patient.Phone,
                TestName = p.OrderItem.Test.Name,
                Price = p.OrderItem.Price,
                Gross = p.OrderItem.Order.GrossAmount,
                Final = p.OrderItem.Order.FinalAmount,
                OrderPaid = p.OrderItem.Order.PaidAmount,
                p.OrderItem.Order.IsComplimentary
            })
            .ToListAsync(ct);

        var truncated = raw.Count > MaxRows;
        if (truncated) raw.RemoveAt(raw.Count - 1);

        if (raw.Count == 0)
            return new CommissionReportResult { MaxRows = MaxRows };

        // ---------- 3. Names: one query per kind + Dictionary O(1) lookups ----------
        var doctorIds = raw.Select(r => r.OrderDoctorId).Concat(raw.Select(r => r.DoctorId))
            .Where(x => x.HasValue).Select(x => x!.Value).Distinct().ToList();
        var referralIds = raw.Select(r => r.OrderReferralId).Concat(raw.Select(r => r.ReferralId))
            .Where(x => x.HasValue).Select(x => x!.Value).Distinct().ToList();
        var technicianIds = raw.Where(r => r.TechnicianId.HasValue).Select(r => r.TechnicianId!.Value).Distinct().ToList();

        var doctors = doctorIds.Count == 0 ? new Dictionary<Guid, string>()
            : await _db.Doctors.AsNoTracking().Where(d => doctorIds.Contains(d.Id)).ToDictionaryAsync(d => d.Id, d => d.FullName, ct);
        var referrals = referralIds.Count == 0 ? new Dictionary<Guid, string>()
            : await _db.Referrals.AsNoTracking().Where(d => referralIds.Contains(d.Id)).ToDictionaryAsync(d => d.Id, d => d.FullName, ct);
        var technicians = technicianIds.Count == 0 ? new Dictionary<Guid, string>()
            : await _db.Technicians.AsNoTracking().Where(d => technicianIds.Contains(d.Id)).ToDictionaryAsync(d => d.Id, d => d.FullName, ct);

        // ---------- 4. Per-line Less / Paid / Due ----------
        // The order-level discount and payment are split across ALL lines of the order
        // (not only the lines in this report) so the numbers always match the invoice.
        // Largest-remainder allocation => parts add up EXACTLY to the order totals.
        var orderIds = raw.Select(r => r.OrderId).Distinct().ToList();
        var siblings = await _db.OrderItems.AsNoTracking()
            .Where(i => orderIds.Contains(i.OrderId))
            .OrderBy(i => i.CreatedAt).ThenBy(i => i.Id)
            .Select(i => new { i.Id, i.OrderId, i.Price })
            .ToListAsync(ct);

        var orderInfo = new Dictionary<Guid, (decimal Gross, decimal Final, decimal Paid, bool Free)>();
        foreach (var r in raw)
            orderInfo.TryAdd(r.OrderId, (r.Gross, r.Final, r.OrderPaid, r.IsComplimentary));

        var shares = new Dictionary<Guid, (decimal Less, decimal Paid, decimal Due)>(siblings.Count);
        foreach (var group in siblings.GroupBy(x => x.OrderId))
        {
            if (!orderInfo.TryGetValue(group.Key, out var info)) continue;
            var lines = group.ToList();
            var prices = lines.Select(l => l.Price).ToList();

            var discount = Math.Max(0m, info.Gross - info.Final);       // complimentary => everything is "less"
            var less = DiscountAllocator.Allocate(prices, discount);
            var net = prices.Select((p, i) => p - less[i]).ToList();
            var paid = DiscountAllocator.Allocate(net, Math.Min(info.Paid, net.Sum()));

            for (var i = 0; i < lines.Count; i++)
            {
                var due = info.Free ? 0m : Math.Max(0m, net[i] - paid[i]);
                shares[lines[i].Id] = (less[i], paid[i], due);
            }
        }

        // ---------- 5. Rows + summary (single pass) ----------
        var result = new CommissionReportResult { Truncated = truncated, MaxRows = MaxRows };
        var sum = result.Summary;

        foreach (var r in raw)
        {
            var entityId = (type switch
            {
                CommissionEntityType.Doctor => r.DoctorId,
                CommissionEntityType.Referral => r.ReferralId,
                _ => r.TechnicianId
            }) ?? Guid.Empty;

            var entityName = type switch
            {
                CommissionEntityType.Doctor => doctors.GetValueOrDefault(entityId, "Unknown"),
                CommissionEntityType.Referral => referrals.GetValueOrDefault(entityId, "Unknown"),
                _ => technicians.GetValueOrDefault(entityId, "Unknown")
            };

            shares.TryGetValue(r.OrderItemId, out var share);

            result.Rows.Add(new CommissionReportRowDto
            {
                PayoutId = r.Id,
                OrderId = r.OrderId,
                OrderNumber = r.OrderNumber,
                OrderDate = r.OrderDate,
                PatientName = r.PatientName,
                PatientPhone = r.PatientPhone,
                TestName = r.TestName,
                TestAmount = r.Price,
                Less = share.Less,
                Paid = share.Paid,
                Due = share.Due,
                DoctorName = r.OrderDoctorId is { } d ? doctors.GetValueOrDefault(d) : null,
                ReferralName = r.OrderReferralId is { } f ? referrals.GetValueOrDefault(f) : null,
                EntityId = entityId,
                EntityName = entityName,
                CommissionAmount = r.CommissionAmount,
                Status = r.Status.ToString(),
                PaidAt = r.PaidAt
            });

            sum.LineTotal += r.Price;
            sum.TotalLess += share.Less;
            sum.TotalPaid += share.Paid;
            sum.TotalDue += share.Due;
            sum.Commission += r.CommissionAmount;
            if (r.Status == CommissionStatusType.Paid) sum.PaidCommission += r.CommissionAmount;
            else sum.UnpaidCommission += r.CommissionAmount;
        }

        sum.TestCount = result.Rows.Count;
        sum.OrderCount = orderIds.Count;
        return result;
    }

    /// <summary>Null = no contact filter was typed (do not narrow by ids).</summary>
    private async Task<List<Guid>?> MatchEntityIdsAsync(
        CommissionEntityType type, GetCommissionReportQuery request, CancellationToken ct)
    {
        static string? Like(string? v) =>
            string.IsNullOrWhiteSpace(v) ? null : $"%{SqlLike.Escape(v.Trim())}%";

        var phoneLike = Like(request.Phone);
        var emailLike = Like(request.Email);
        var addressLike = Like(request.Address);
        if (phoneLike is null && emailLike is null && addressLike is null) return null;

        // Format-insensitive phone match ("98300-12345" == "9830012345"); null if < 6 digits.
        var phonePattern = PhoneNormalizer.FormatInsensitiveLikePattern(request.Phone);

        switch (type)
        {
            case CommissionEntityType.Doctor:
            {
                var q = _db.Doctors.AsNoTracking().AsQueryable();
                if (phoneLike != null) q = q.Where(x => EF.Functions.ILike(x.Phone, phoneLike) || (phonePattern != null && EF.Functions.Like(x.Phone, phonePattern)));
                if (emailLike != null) q = q.Where(x => x.Email != null && EF.Functions.ILike(x.Email, emailLike));
                if (addressLike != null) q = q.Where(x => x.Address != null && EF.Functions.ILike(x.Address, addressLike));
                return await q.Select(x => x.Id).ToListAsync(ct);
            }
            case CommissionEntityType.Referral:
            {
                var q = _db.Referrals.AsNoTracking().AsQueryable();
                if (phoneLike != null) q = q.Where(x => EF.Functions.ILike(x.Phone, phoneLike) || (phonePattern != null && EF.Functions.Like(x.Phone, phonePattern)));
                if (emailLike != null) q = q.Where(x => x.Email != null && EF.Functions.ILike(x.Email, emailLike));
                if (addressLike != null) q = q.Where(x => x.Address != null && EF.Functions.ILike(x.Address, addressLike));
                return await q.Select(x => x.Id).ToListAsync(ct);
            }
            default:
            {
                var q = _db.Technicians.AsNoTracking().AsQueryable();
                if (phoneLike != null) q = q.Where(x => EF.Functions.ILike(x.Phone, phoneLike) || (phonePattern != null && EF.Functions.Like(x.Phone, phonePattern)));
                if (emailLike != null) q = q.Where(x => x.Email != null && EF.Functions.ILike(x.Email, emailLike));
                if (addressLike != null) q = q.Where(x => x.Address != null && EF.Functions.ILike(x.Address, addressLike));
                return await q.Select(x => x.Id).ToListAsync(ct);
            }
        }
    }
}