using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.ReportDocuments.Common;
using LokynexHealth.Application.ReportDocuments.Queries.GetOrdersForReport;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.ReportDocuments.Queries.GetOrderForReport;

public class GetOrderForReportQueryHandler : IRequestHandler<GetOrderForReportQuery, OrderForReportDto>
{
    private readonly IApplicationDbContext _db;

    public GetOrderForReportQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<OrderForReportDto> Handle(GetOrderForReportQuery request, CancellationToken ct)
    {
        var order = await _db.Orders
            .AsNoTracking()
            .AsSplitQuery()
            .Include(o => o.Patient)
            .Include(o => o.Relative)
            .Include(o => o.Branch)
            .Include(o => o.Items).ThenInclude(i => i.Test).ThenInclude(t => t.Department)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId && !o.IsDeleted, ct)
            ?? throw new NotFoundException(nameof(Order), request.OrderId);

        var counts = await OrderForReportMapper.CountReportsAsync(
            _db, order.Items.Select(i => i.Id).ToList(), ct);

        var dto = OrderForReportMapper.Map(order, counts);

        // Doctor / referral live in the platform schema (no navigation) — fetch by key.
        if (order.DoctorId.HasValue)
        {
            dto.DoctorName = await _db.Doctors.AsNoTracking()
                .Where(d => d.Id == order.DoctorId.Value)
                .Select(d => d.FullName)
                .FirstOrDefaultAsync(ct);
        }

        if (order.ReferralId.HasValue)
        {
            dto.ReferralName = await _db.Referrals.AsNoTracking()
                .Where(r => r.Id == order.ReferralId.Value)
                .Select(r => r.FullName)
                .FirstOrDefaultAsync(ct);
        }

        return dto;
    }
}