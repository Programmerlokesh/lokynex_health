using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using LokynexHealth.Domain.Enums;
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
        // This lab's effective doctors: global list + this lab's own edits,
        // minus the ones this lab removed.
        var query = _db.Doctors.AsNoTracking().Where(d => !d.IsHidden);

        if (request.ActiveOnly)
            query = query.Where(d => d.Status == PlatformRecordStatus.Active);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = $"%{request.Search}%";
            // Format-insensitive phone match (null when the search has < 6 digits).
            var phonePattern = PhoneNormalizer.FormatInsensitiveLikePattern(request.Search);

            query = query.Where(d =>
                EF.Functions.ILike(d.FullName, term) ||
                (d.Email != null && EF.Functions.ILike(d.Email, term)) ||
                EF.Functions.ILike(d.Phone, term) ||
                (phonePattern != null && EF.Functions.Like(d.Phone, phonePattern)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var doctorEntities = await query
            .OrderBy(d => d.FullName)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var doctors = doctorEntities.Select(d => new DoctorDto
        {
            Id = d.Id,
            FullName = d.FullName,
            Phone = d.Phone,
            WhatsappNumber = d.WhatsappNumber,
            Email = d.Email,
            Address = d.Address,
            Specialization = d.Specialization,
            Status = d.Status.ToString()
        }).ToList();

        return new PagedResult<DoctorDto>
        {
            Items = doctors,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}