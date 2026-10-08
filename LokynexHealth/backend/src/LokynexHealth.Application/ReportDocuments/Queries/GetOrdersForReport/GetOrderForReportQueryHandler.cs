using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using LokynexHealth.Application.ReportDocuments.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.ReportDocuments.Queries.GetOrdersForReport;

public class GetOrdersForReportQueryHandler : IRequestHandler<GetOrdersForReportQuery, PagedResult<OrderForReportDto>>
{
    private readonly IApplicationDbContext _db;

    public GetOrdersForReportQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<OrderForReportDto>> Handle(GetOrdersForReportQuery request, CancellationToken ct)
    {
        var pageSize = Math.Clamp(request.PageSize, 1, 50);
        var page = Math.Max(1, request.PageNumber);

        var query = _db.Orders.AsNoTracking().Where(o => !o.IsDeleted);

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

        if (request.OnlyPending)
        {
            query = query.Where(o => o.Items.Any(i =>
                !_db.ReportDocuments.Any(d => d.OrderItemId == i.Id && !d.IsDeleted)));
        }

        var total = await query.CountAsync(ct);

        var orders = await query
            .Include(o => o.Patient)
            .Include(o => o.Relative)
            .Include(o => o.Items).ThenInclude(i => i.Test).ThenInclude(t => t.Department)
            .AsSplitQuery()
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var counts = await OrderForReportMapper.CountReportsAsync(
            _db, orders.SelectMany(o => o.Items).Select(i => i.Id).ToList(), ct);

        return new PagedResult<OrderForReportDto>
        {
            Items = orders.Select(o => OrderForReportMapper.Map(o, counts)).ToList(),
            TotalCount = total,
            PageNumber = page,
            PageSize = pageSize
        };
    }
}