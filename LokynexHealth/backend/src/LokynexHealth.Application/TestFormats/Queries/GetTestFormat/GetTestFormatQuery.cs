using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.TestFormats.Queries.GetTestFormat;

public class GetTestFormatQuery : IRequest<TestFormatDto>
{
    public Guid TestId { get; set; }
}

public class GetTestFormatQueryHandler : IRequestHandler<GetTestFormatQuery, TestFormatDto>
{
    private readonly IApplicationDbContext _db;

    public GetTestFormatQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<TestFormatDto> Handle(GetTestFormatQuery request, CancellationToken ct)
    {
        var test = await _db.Tests.AsNoTracking()
            .Include(t => t.Department)
            .FirstOrDefaultAsync(t => t.Id == request.TestId, ct)
            ?? throw new NotFoundException(nameof(Test), request.TestId);

        var parameters = await _db.TestParameters.AsNoTracking()
            .Include(p => p.ReferenceRanges)
            .Where(p => p.TestId == test.Id && p.Status == RecordStatus.Active)
            .OrderBy(p => p.SortOrder).ThenBy(p => p.Name)
            .ToListAsync(ct);

        var info = await _db.TestReportInfos.AsNoTracking()
            .FirstOrDefaultAsync(x => x.TestId == test.Id, ct);

        return new TestFormatDto
        {
            TestId = test.Id,
            TestName = test.Name,
            DepartmentName = test.Department?.Name ?? string.Empty,
            Specimen = info?.Specimen,
            Method = info?.Method,
            MachineName = info?.MachineName,
            ReagentName = info?.ReagentName,
            Interpretation = info?.Interpretation,
            Parameters = parameters.Select(p => new TestFormatParameterDto
            {
                Id = p.Id,
                SectionName = p.SectionName,
                Name = p.Name,
                Unit = p.Unit,
                ResultType = p.ResultType,
                IsBold = p.IsBold,
                Ranges = p.ReferenceRanges
                    .OrderBy(r => r.Gender != null)
                    .ThenBy(r => r.AgeMinDays ?? -1)
                    .Select(r => new TestFormatRangeDto
                    {
                        Gender = r.Gender?.ToString(),
                        AgeMinDays = r.AgeMinDays,
                        AgeMaxDays = r.AgeMaxDays,
                        LowValue = r.LowValue,
                        HighValue = r.HighValue,
                        CriticalLow = r.CriticalLow,
                        CriticalHigh = r.CriticalHigh,
                        NormalText = r.NormalText,
                        DisplayText = r.DisplayText
                    }).ToList()
            }).ToList()
        };
    }
}