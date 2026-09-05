using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Doctors.Queries.GetDoctors;

public class GetDoctorsQueryHandler : IRequestHandler<GetDoctorsQuery, PagedResult<DoctorDto>>
{
    private readonly IApplicationDbContext _db;

    public GetDoctorsQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<DoctorDto>> Handle(GetDoctorsQuery request, CancellationToken cancellationToken)
    {
        var query = _db.Doctors.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = $"%{request.Search}%";
            query = query.Where(d =>
                EF.Functions.ILike(d.FullName, term) ||
                (d.Email != null && EF.Functions.ILike(d.Email, term)) ||
                EF.Functions.ILike(d.Phone, term));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var doctors = await query
            .OrderBy(d => d.FullName)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(d => new DoctorDto
            {
                Id = d.Id,
                FullName = d.FullName,
                Phone = d.Phone,
                Email = d.Email,
                Address = d.Address,
                Specialization = d.Specialization,
                Status = d.Status.ToString()
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<DoctorDto>
        {
            Items = doctors,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}