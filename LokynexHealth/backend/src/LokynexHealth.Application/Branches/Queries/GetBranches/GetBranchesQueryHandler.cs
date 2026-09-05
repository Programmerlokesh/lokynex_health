using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Branches.Queries.GetBranches;

public class GetBranchesQueryHandler : IRequestHandler<GetBranchesQuery, PagedResult<BranchDto>>
{
    private readonly IApplicationDbContext _db;

    public GetBranchesQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<BranchDto>> Handle(GetBranchesQuery request, CancellationToken cancellationToken)
    {
        var query = _db.Branches.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var searchTerm = $"%{request.Search}%";
            query = query.Where(b =>
                EF.Functions.ILike(b.BranchName, searchTerm) ||
                EF.Functions.ILike(b.BranchCode, searchTerm));
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && request.Status != "All")
        {
            if (Enum.TryParse<RecordStatus>(request.Status, out var statusEnum))
            {
                var statusText = statusEnum.ToString();
                query = query.Where(b => b.Status.ToString() == statusText);
            }
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var branches = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(b => new BranchDto
            {
                Id = b.Id,
                BranchName = b.BranchName,
                BranchCode = b.BranchCode,
                BranchAddress = b.BranchAddress,
                BranchPincode = b.BranchPincode,
                BranchPhone = b.BranchPhone,
                BranchEmail = b.BranchEmail,
                CreatedBySuperAdmin = b.CreatedBySuperAdmin,
                Status = b.Status.ToString(),
                CreatedAt = b.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<BranchDto>
        {
            Items = branches,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}