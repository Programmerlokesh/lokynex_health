using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.ReportDocuments.Queries.GetOrderItemsForReport;

// Powers the order-item search box in Report Builder's "Generate Document"
// dialog — there's no order-detail endpoint yet, so this is the lookup that
// lets the frontend resolve "which order item" a report should be generated for.
public class GetOrderItemsForReportQueryHandler : IRequestHandler<GetOrderItemsForReportQuery, List<OrderItemLookupDto>>
{
    private readonly IApplicationDbContext _db;

    public GetOrderItemsForReportQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<OrderItemLookupDto>> Handle(GetOrderItemsForReportQuery request, CancellationToken cancellationToken)
    {
        var query = _db.OrderItems
            .Include(i => i.Test)
            .Include(i => i.Order).ThenInclude(o => o.Patient)
            .Include(i => i.Order).ThenInclude(o => o.Relative)
            .Where(i => !i.Order.IsDeleted)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(i =>
                i.Order.OrderNumber.ToLower().Contains(search) ||
                i.Order.Patient.Phone.Contains(search) ||
                i.Test.Name.ToLower().Contains(search) ||
                (i.Order.Relative != null && i.Order.Relative.Name.ToLower().Contains(search)));
        }

        return await query
            .OrderByDescending(i => i.CreatedAt)
            .Take(20)
            .Select(i => new OrderItemLookupDto
            {
                Id = i.Id,
                OrderNumber = i.Order.OrderNumber,
                TestName = i.Test.Name,
                PatientName = i.Order.Relative != null ? i.Order.Relative.Name : i.Order.Patient.Phone,
                PatientPhone = i.Order.Patient.Phone
            })
            .ToListAsync(cancellationToken);
    }
}