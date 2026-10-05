using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Orders.Queries.ExportOrders;

public class ExportOrdersQueryHandler : IRequestHandler<ExportOrdersQuery, OrderExportDto>
{
    public const int MaxRows = 5000;
    private readonly IApplicationDbContext _db;

    public ExportOrdersQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<OrderExportDto> Handle(ExportOrdersQuery request, CancellationToken ct)
    {
        var raw = await request.Apply(_db.Orders.AsNoTracking())
            .OrderBy(o => o.CreatedAt).ThenBy(o => o.Id)
            .Take(MaxRows + 1)
            .Select(o => new
            {
                o.OrderNumber,
                o.CreatedAt,
                PatientName = o.Relative != null ? o.Relative.Name : (o.Patient.FullName != "" ? o.Patient.FullName : o.Patient.Phone),
                o.DoctorId,
                o.ReferralId,
                o.FinalAmount,
                o.PaidAmount,
                o.IsComplimentary,
                Tests = o.Items.OrderBy(i => i.CreatedAt).Select(i => new OrderExportTestDto { Name = i.Test.Name, Amount = i.Price }).ToList()
            })
            .ToListAsync(ct);

        var truncated = raw.Count > MaxRows;
        if (truncated) raw.RemoveAt(raw.Count - 1);

        var doctorIds = raw.Where(r => r.DoctorId.HasValue).Select(r => r.DoctorId!.Value).Distinct().ToList();
        var referralIds = raw.Where(r => r.ReferralId.HasValue).Select(r => r.ReferralId!.Value).Distinct().ToList();
        var doctors = new Dictionary<Guid, string>();
        if (doctorIds.Count > 0)
            doctors = await _db.Doctors.AsNoTracking()
                .Where(d => doctorIds.Contains(d.Id)).ToDictionaryAsync(d => d.Id, d => d.FullName, ct);
        var referrals = new Dictionary<Guid, string>();
        if (referralIds.Count > 0)
            referrals = await _db.Referrals.AsNoTracking()
                .Where(d => referralIds.Contains(d.Id)).ToDictionaryAsync(d => d.Id, d => d.FullName, ct);

        var result = new OrderExportDto { Truncated = truncated, TotalOrders = raw.Count };
        foreach (var r in raw)
        {
            var due = r.IsComplimentary ? 0m : Math.Max(0m, r.FinalAmount - r.PaidAmount);
            var testAmount = r.Tests.Sum(t => t.Amount);
            result.Rows.Add(new OrderExportRowDto
            {
                OrderNumber = r.OrderNumber,
                CreatedAt = r.CreatedAt,
                PatientName = r.PatientName,
                DoctorName = r.DoctorId is { } d && doctors.TryGetValue(d, out var dn) ? dn : null,
                ReferralName = r.ReferralId is { } f && referrals.TryGetValue(f, out var rn) ? rn : null,
                Tests = r.Tests,
                TestAmount = testAmount,
                Paid = r.PaidAmount,
                Due = due
            });
            result.TotalTestAmount += testAmount;
            result.TotalPaid += r.PaidAmount;
            result.TotalDue += due;
        }
        return result;
    }
}