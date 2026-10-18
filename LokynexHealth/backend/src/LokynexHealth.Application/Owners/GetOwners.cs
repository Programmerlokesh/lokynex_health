using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Owners;

public class GetOwnersQuery : IRequest<PagedResult<OwnerDto>>
{
    public string? Search { get; set; }
    public string? Status { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class GetOwnerByIdQuery : IRequest<OwnerDto>
{
    public Guid Id { get; set; }
}

/// <summary>The signed-in staff member's own profile (GET /api/owner/me).</summary>
public class GetMyOwnerProfileQuery : IRequest<OwnerDto> { }

internal static class OwnerMapper
{
    public static OwnerDto ToDto(Owner o, int labCount) => new()
    {
        Id = o.Id,
        Name = o.Name,
        Role = o.Role,
        Username = o.Username,
        Phone = o.Phone,
        WhatsappNumber = o.WhatsappNumber,
        Address = o.Address,
        Pincode = o.Pincode,
        ProfilePictureUrl = o.ProfilePictureUrl,
        Status = o.Status.ToString(),
        LabCount = labCount,
        Permissions = StaffPanels.ToDto(o.Permissions),
        CreatedAt = o.CreatedAt,
        UpdatedAt = o.UpdatedAt
    };
}

public class GetOwnersQueryHandler : IRequestHandler<GetOwnersQuery, PagedResult<OwnerDto>>
{
    private readonly IApplicationDbContext _db;
    public GetOwnersQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<PagedResult<OwnerDto>> Handle(GetOwnersQuery r, CancellationToken ct)
    {
        var page = Math.Max(r.PageNumber, 1);
        var size = Math.Clamp(r.PageSize, 1, 200);

        var q = _db.Owners.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(r.Search))
        {
            var term = $"%{r.Search.Trim()}%";
            q = q.Where(o => EF.Functions.ILike(o.Name, term)
                          || EF.Functions.ILike(o.Username, term)
                          || EF.Functions.ILike(o.Phone, term));
        }
        if (r.Status == "Active")
            q = q.Where(o => o.Status == PlatformRecordStatus.Active);
        else if (r.Status == "Inactive")
            q = q.Where(o => o.Status == PlatformRecordStatus.Inactive);

        var total = await q.CountAsync(ct);
        var owners = await q.OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * size).Take(size).ToListAsync(ct);

        // ONE grouped query for every staff member's lab count (no N+1).
        var ids = owners.Select(o => o.Id).ToList();
        var counts = await _db.Tenants.AsNoTracking()
            .Where(t => t.CreatedByOwnerId != null && ids.Contains(t.CreatedByOwnerId.Value))
            .GroupBy(t => t.CreatedByOwnerId!.Value)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count, ct);

        return new PagedResult<OwnerDto>
        {
            Items = owners.Select(o => OwnerMapper.ToDto(o, counts.GetValueOrDefault(o.Id))).ToList(),
            TotalCount = total,
            PageNumber = page,
            PageSize = size
        };
    }
}

public class GetOwnerByIdQueryHandler : IRequestHandler<GetOwnerByIdQuery, OwnerDto>
{
    private readonly IApplicationDbContext _db;
    public GetOwnerByIdQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<OwnerDto> Handle(GetOwnerByIdQuery r, CancellationToken ct)
    {
        var o = await _db.Owners.AsNoTracking().FirstOrDefaultAsync(x => x.Id == r.Id, ct)
            ?? throw new NotFoundException("Owner", r.Id);
        var count = await _db.Tenants.CountAsync(t => t.CreatedByOwnerId == o.Id, ct);
        return OwnerMapper.ToDto(o, count);
    }
}

public class GetMyOwnerProfileQueryHandler : IRequestHandler<GetMyOwnerProfileQuery, OwnerDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public GetMyOwnerProfileQueryHandler(IApplicationDbContext db, ICurrentUserService user)
    {
        _db = db;
        _user = user;
    }

    public async Task<OwnerDto> Handle(GetMyOwnerProfileQuery r, CancellationToken ct)
    {
        var o = await OwnerAccess.RequireActiveOwnerAsync(_db, _user, ct);
        var count = await _db.Tenants.CountAsync(t => t.CreatedByOwnerId == o.Id, ct);
        return OwnerMapper.ToDto(o, count);
    }
}