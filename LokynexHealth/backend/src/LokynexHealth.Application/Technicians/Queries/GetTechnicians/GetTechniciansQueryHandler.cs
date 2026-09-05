using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Technicians.Queries.GetTechnicians;

public class GetTechniciansQueryHandler : IRequestHandler<GetTechniciansQuery, PagedResult<TechnicianDto>>
{
    private readonly IApplicationDbContext _db;

    public GetTechniciansQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<TechnicianDto>> Handle(GetTechniciansQuery request, CancellationToken cancellationToken)
    {
        var query = _db.Technicians.Include(t => t.Branch).AsQueryable();

        if (request.BranchId.HasValue)
            query = query.Where(t => t.BranchId == request.BranchId.Value);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = $"%{request.Search}%";
            query = query.Where(t =>
                EF.Functions.ILike(t.FullName, term) ||
                (t.Email != null && EF.Functions.ILike(t.Email, term)) ||
                EF.Functions.ILike(t.Phone, term));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var technicians = await query
            .OrderBy(t => t.FullName)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(t => new TechnicianDto
            {
                Id = t.Id,
                BranchId = t.BranchId,
                BranchName = t.Branch.BranchName,
                FullName = t.FullName,
                Phone = t.Phone,
                Email = t.Email,
                Address = t.Address,
                Status = t.Status.ToString()
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<TechnicianDto>
        {
            Items = technicians,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}