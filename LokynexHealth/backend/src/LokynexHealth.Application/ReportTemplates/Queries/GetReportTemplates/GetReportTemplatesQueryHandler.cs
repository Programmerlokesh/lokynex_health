using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.ReportTemplates.Queries.GetReportTemplates;

public class GetReportTemplatesQueryHandler : IRequestHandler<GetReportTemplatesQuery, PagedResult<ReportTemplateDto>>
{
    private readonly IApplicationDbContext _db;

    public GetReportTemplatesQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<ReportTemplateDto>> Handle(GetReportTemplatesQuery request, CancellationToken cancellationToken)
    {
        var query = _db.ReportTemplates.Where(t => t.IsDeleted == request.ShowDeleted);

        var totalCount = await query.CountAsync(cancellationToken);

        // Materialize FIRST — then map SourceType.ToString() in memory (LINQ-to-Objects).
        // Doing .ToString() inside a .Select() that runs before .ToListAsync() gets
        // translated to SQL and breaks native Postgres enums — the exact bug already
        // fixed in GetTechniciansQueryHandler, GetCommissionOverridesQueryHandler, etc.
        var templateEntities = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var templates = templateEntities.Select(t => new ReportTemplateDto
        {
            Id = t.Id,
            Name = t.Name,
            SourceType = t.SourceType.ToString(),
            IsDeleted = t.IsDeleted,
            CreatedAt = t.CreatedAt
        }).ToList();

        return new PagedResult<ReportTemplateDto>
        {
            Items = templates,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}