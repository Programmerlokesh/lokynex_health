using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Patients.Queries.SearchPatients;

public class SearchPatientsQueryHandler : IRequestHandler<SearchPatientsQuery, List<PatientDto>>
{
    private readonly IApplicationDbContext _db;

    public SearchPatientsQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<PatientDto>> Handle(SearchPatientsQuery request, CancellationToken cancellationToken)
    {
        var phone = PhoneNormalizer.Normalize(request.Phone);
        if (phone.Length < 3) return new List<PatientDto>();

        var limit = Math.Clamp(request.Limit, 1, 20);

        // StartsWith -> "phone LIKE 'x%'" which uses idx_patients_phone_prefix
        // (varchar_pattern_ops). Exact matches sort first so a full number
        // always lands on top; ties break on newest registration.
        var patients = await _db.Patients
            .AsNoTracking()
            .Include(p => p.Relatives)
            .Where(p => p.Phone.StartsWith(phone))
            .OrderBy(p => p.Phone == phone ? 0 : 1)
            .ThenBy(p => p.Phone)
            .Take(limit)
            .ToListAsync(cancellationToken);

        // Enum -> string AFTER materialising (native PG enums can't be
        // ToString()'d inside the SQL projection).
        return patients.Select(p => new PatientDto
        {
            Id = p.Id,
            PatientCode = p.PatientCode,
            FullName = p.FullName,
            Phone = p.Phone,
            Age = p.Age,
            Gender = p.Gender?.ToString(),
            Address = p.Address,
            Email = p.Email,
            Relatives = p.Relatives
                .OrderBy(r => r.CreatedAt)
                .Select(r => new PatientRelativeDto
                {
                    Id = r.Id,
                    Name = r.Name,
                    Age = r.Age,
                    Gender = r.Gender?.ToString(),
                    Relationship = r.Relationship
                })
                .ToList()
        }).ToList();
    }
}