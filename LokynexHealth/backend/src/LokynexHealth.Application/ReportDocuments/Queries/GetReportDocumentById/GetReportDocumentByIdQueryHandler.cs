using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.ReportDocuments.Queries.GetReportDocuments;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.ReportDocuments.Queries.GetReportDocumentById;

public class GetReportDocumentByIdQueryHandler : IRequestHandler<GetReportDocumentByIdQuery, ReportDocumentDto>
{
    private readonly IApplicationDbContext _db;

    public GetReportDocumentByIdQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ReportDocumentDto> Handle(GetReportDocumentByIdQuery request, CancellationToken ct)
    {
        return await _db.ReportDocuments
            .AsNoTracking()
            .Where(d => d.Id == request.Id)
            .Select(ReportDocumentProjection.ToDto)
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException(nameof(ReportDocument), request.Id);
    }
}