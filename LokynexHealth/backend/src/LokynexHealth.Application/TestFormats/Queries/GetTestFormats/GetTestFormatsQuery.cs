using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.TestFormats.Queries.GetTestFormats;

public class GetTestFormatsQuery : IRequest<List<TestFormatListItemDto>>
{
    public string? Search { get; set; }
}

public class GetTestFormatsQueryHandler : IRequestHandler<GetTestFormatsQuery, List<TestFormatListItemDto>>
{
    private readonly IApplicationDbContext _db;

    public GetTestFormatsQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<TestFormatListItemDto>> Handle(GetTestFormatsQuery request, CancellationToken ct)
    {
        var q = _db.Tests.AsNoTracking().Where(t => t.Status == RecordStatus.Active);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim().ToLower();
            q = q.Where(t => t.Name.ToLower().Contains(s) || t.Department.Name.ToLower().Contains(s));
        }

        var tests = await q
            .OrderBy(t => t.Department.Name).ThenBy(t => t.Name)
            .Take(500)
            .Select(t => new { t.Id, t.Name, Department = t.Department.Name })
            .ToListAsync(ct);

        var counts = await _db.TestParameters.AsNoTracking()
            .Where(p => p.Status == RecordStatus.Active)
            .GroupBy(p => p.TestId)
            .Select(g => new { TestId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.TestId, x => x.Count, ct);

        return tests.Select(t => new TestFormatListItemDto
        {
            TestId = t.Id,
            TestName = t.Name,
            DepartmentName = t.Department,
            ParameterCount = counts.GetValueOrDefault(t.Id)
        }).ToList();
    }
}