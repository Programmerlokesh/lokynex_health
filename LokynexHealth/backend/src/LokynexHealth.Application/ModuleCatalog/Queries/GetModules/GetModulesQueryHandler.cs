using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.ModuleCatalog.Queries.GetModules;

public class GetModulesQueryHandler : IRequestHandler<GetModulesQuery, List<ModuleListItemDto>>
{
    private readonly IApplicationDbContext _db;

    public GetModulesQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<ModuleListItemDto>> Handle(GetModulesQuery request, CancellationToken cancellationToken)
    {
        return await _db.Modules
            .OrderBy(m => m.Id)
            .Select(m => new ModuleListItemDto
            {
                Id = m.Id,
                Name = m.Name
            })
            .ToListAsync(cancellationToken);
    }
}