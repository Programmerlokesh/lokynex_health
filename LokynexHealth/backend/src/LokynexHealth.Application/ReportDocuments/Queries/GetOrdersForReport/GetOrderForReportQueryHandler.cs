using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.ReportDocuments.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.ReportDocuments.Queries.GetOrdersForReport;

public class GetOrdersForReportQueryHandler : IRequestHandler<GetOrdersForReportQuery, OrdersForReportResult>
{
    private readonly IApplicationDbContext _db;

    public GetOrdersForReportQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<OrdersForReportResult> Handle(GetOrdersForReportQuery request, CancellationToken ct)
    {
        var pageSize = Math.Clamp(request.PageSize, 1, 50);
        var page = Math.Max(1, request.PageNumber);

        var query = _db.Orders.AsNoTracking().Where(o => !o.IsDeleted);

        // ---------- quick search ----------
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim().ToLower();
            query = query.Where(o =>
                o.OrderNumber.ToLower().Contains(s) ||
                o.Patient.Phone.Contains(s) ||
                o.Patient.FullName.ToLower().Contains(s) ||
                (o.Relative != null && o.Relative.Name.ToLower().Contains(s)) ||
                o.Items.Any(i => i.Test.Name.ToLower().Contains(s)));
        }

        // ---------- date range ----------
        if (request.From.HasValue) query = query.Where(o => o.CreatedAt >= request.From.Value);
        if (request.To.HasValue) query = query.Where(o => o.CreatedAt < request.To.Value);

        // ---------- individual fields ----------
        if (!string.IsNullOrWhiteSpace(request.PatientName))
        {
            var n = request.PatientName.Trim().ToLower();
            query = query.Where(o =>
                o.Patient.FullName.ToLower().Contains(n) ||
                (o.Relative != null && o.Relative.Name.ToLower().Contains(n)));
        }

        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            var p = request.Phone.Trim();
            query = query.Where(o => o.Patient.Phone.Contains(p));
        }

        if (!string.IsNullOrWhiteSpace(request.OrderNumber))
        {
            var no = request.OrderNumber.Trim().ToLower();
            query = query.Where(o => o.OrderNumber.ToLower().Contains(no));
        }

        if (!string.IsNullOrWhiteSpace(request.TestName))
        {
            var t = request.TestName.Trim().ToLower();
            query = query.Where(o => o.Items.Any(i => i.Test.Name.ToLower().Contains(t)));
        }

        // ---------- counts BEFORE the status filter, so the pills can show the split ----------
        var allCount = await query.CountAsync(ct);
        var pendingCount = await query.CountAsync(o => o.Items.Any(i =>
            !_db.ReportDocuments.Any(d => d.OrderItemId == i.Id && !d.IsDeleted)), ct);
        var reportedCount = allCount - pendingCount;

        // ---------- status ----------
        var status = request.OnlyPending && string.IsNullOrWhiteSpace(request.Status)
            ? "pending"
            : (request.Status ?? "any").Trim().ToLower();

        int total;
        if (status == "pending")
        {
            query = query.Where(o => o.Items.Any(i =>
                !_db.ReportDocuments.Any(d => d.OrderItemId == i.Id && !d.IsDeleted)));
            total = pendingCount;
        }
        else if (status == "reported")
        {
            query = query.Where(o => !o.Items.Any(i =>
                !_db.ReportDocuments.Any(d => d.OrderItemId == i.Id && !d.IsDeleted)));
            total = reportedCount;
        }
        else
        {
            total = allCount;
        }

        var orders = await query
            .Include(o => o.Patient)
            .Include(o => o.Relative)
            .Include(o => o.Branch)
            .Include(o => o.Items).ThenInclude(i => i.Test).ThenInclude(t => t.Department)
            .AsSplitQuery()
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var counts = await OrderForReportMapper.CountReportsAsync(
            _db, orders.SelectMany(o => o.Items).Select(i => i.Id).ToList(), ct);

        return new OrdersForReportResult
        {
            Items = orders.Select(o => OrderForReportMapper.Map(o, counts)).ToList(),
            TotalCount = total,
            PageNumber = page,
            PageSize = pageSize,
            PendingCount = pendingCount,
            ReportedCount = reportedCount
        };
    }
}