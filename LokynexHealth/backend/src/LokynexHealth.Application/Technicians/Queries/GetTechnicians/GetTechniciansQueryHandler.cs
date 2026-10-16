using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using LokynexHealth.Domain.Enums;
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
        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 200);

        var query = _db.Technicians.AsNoTracking().Include(t => t.Branch).AsQueryable();

        if (request.BranchId.HasValue)
            query = query.Where(t => t.BranchId == request.BranchId.Value);

        if (Enum.TryParse<RecordStatus>(request.Status, true, out var status))
            query = query.Where(t => t.Status == status);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = $"%{request.Search}%";
            var phonePattern = PhoneNormalizer.FormatInsensitiveLikePattern(request.Search);

            query = query.Where(t =>
                EF.Functions.ILike(t.FullName, term) ||
                (t.Email != null && EF.Functions.ILike(t.Email, term)) ||
                EF.Functions.ILike(t.Phone, term) ||
                (phonePattern != null && EF.Functions.Like(t.Phone, phonePattern)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var technicianEntities = await query
            .OrderBy(t => t.FullName)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var technicians = technicianEntities.Select(t => new TechnicianDto
        {
            Id = t.Id,
            BranchId = t.BranchId,
            BranchName = t.Branch.BranchName,
            FullName = t.FullName,
            Phone = t.Phone,
            WhatsappNumber = t.WhatsappNumber,
            Email = t.Email,
            Address = t.Address,
            Status = t.Status.ToString()
        }).ToList();

        return new PagedResult<TechnicianDto>
        {
            Items = technicians,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }
}