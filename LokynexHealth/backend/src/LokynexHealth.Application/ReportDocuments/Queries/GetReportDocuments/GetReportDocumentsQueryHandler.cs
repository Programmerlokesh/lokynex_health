using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.ReportDocuments.Queries.GetReportDocuments;

public class GetReportDocumentsQueryHandler : IRequestHandler<GetReportDocumentsQuery, PagedResult<ReportDocumentDto>>
{
    private readonly IApplicationDbContext _db;

    public GetReportDocumentsQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<ReportDocumentDto>> Handle(GetReportDocumentsQuery request, CancellationToken cancellationToken)
    {
        var query = _db.ReportDocuments
            .AsNoTracking()
            .Where(d => d.IsDeleted == request.ShowDeleted);

        if (request.OrderItemId.HasValue)
            query = query.Where(d => d.OrderItemId == request.OrderItemId.Value);

        if (request.OrderId.HasValue)
            query = query.Where(d => d.OrderItem.OrderId == request.OrderId.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var docs = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(ReportDocumentProjection.ToDto)
            .ToListAsync(cancellationToken);

        return new PagedResult<ReportDocumentDto>
        {
            Items = docs,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}