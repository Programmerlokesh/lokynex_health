using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Tests.Queries.GetTests;

public class GetTestsQueryHandler : IRequestHandler<GetTestsQuery, PagedResult<TestDto>>
{
    private readonly IApplicationDbContext _db;

    public GetTestsQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<TestDto>> Handle(GetTestsQuery request, CancellationToken cancellationToken)
    {
        var query = _db.Tests.Include(t => t.Department).AsQueryable();

        if (request.DepartmentId.HasValue)
            query = query.Where(t => t.DepartmentId == request.DepartmentId.Value);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var searchTerm = $"%{request.Search}%";
            query = query.Where(t => EF.Functions.ILike(t.Name, searchTerm));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var tests = await query
            .OrderBy(t => t.Name)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(t => new TestDto
            {
                Id = t.Id,
                DepartmentId = t.DepartmentId,
                DepartmentName = t.Department.Name,
                Name = t.Name,
                Price = t.Price,
                DoctorCommissionType = t.DoctorCommissionType.ToString(),
                DoctorCommissionValue = t.DoctorCommissionValue,
                ReferralCommissionType = t.ReferralCommissionType.ToString(),
                ReferralCommissionValue = t.ReferralCommissionValue,
                TechnicianCommissionType = t.TechnicianCommissionType.ToString(),
                TechnicianCommissionValue = t.TechnicianCommissionValue,
                Status = t.Status.ToString()
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<TestDto>
        {
            Items = tests,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}