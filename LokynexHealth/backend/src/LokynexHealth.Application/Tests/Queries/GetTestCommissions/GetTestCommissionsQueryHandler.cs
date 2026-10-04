using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Tests.Queries.GetTestCommissions;

public class GetTestCommissionsQueryHandler : IRequestHandler<GetTestCommissionsQuery, List<TestCommissionDto>>
{
    private readonly IApplicationDbContext _db;

    public GetTestCommissionsQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<TestCommissionDto>> Handle(GetTestCommissionsQuery request, CancellationToken cancellationToken)
    {
        var rows = await _db.CommissionOverrides
            .Where(c => c.TestId == request.TestId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

        var doctorIds = rows.Where(r => r.DoctorId.HasValue).Select(r => r.DoctorId!.Value).ToList();
        var referralIds = rows.Where(r => r.ReferralId.HasValue).Select(r => r.ReferralId!.Value).ToList();
        var technicianIds = rows.Where(r => r.TechnicianId.HasValue).Select(r => r.TechnicianId!.Value).ToList();

        var doctors = doctorIds.Count == 0 ? new Dictionary<Guid, string>()
            : await _db.Doctors.Where(d => doctorIds.Contains(d.Id)).ToDictionaryAsync(d => d.Id, d => d.FullName, cancellationToken);
        var referrals = referralIds.Count == 0 ? new Dictionary<Guid, string>()
            : await _db.Referrals.Where(d => referralIds.Contains(d.Id)).ToDictionaryAsync(d => d.Id, d => d.FullName, cancellationToken);
        var technicians = technicianIds.Count == 0 ? new Dictionary<Guid, string>()
            : await _db.Technicians.Where(d => technicianIds.Contains(d.Id)).ToDictionaryAsync(d => d.Id, d => d.FullName, cancellationToken);

        return rows.Select(c =>
        {
            var id = (c.DoctorId ?? c.ReferralId ?? c.TechnicianId)!.Value;
            var name = c.EntityType switch
            {
                CommissionEntityType.Doctor => doctors.GetValueOrDefault(id, "Unknown"),
                CommissionEntityType.Referral => referrals.GetValueOrDefault(id, "Unknown"),
                _ => technicians.GetValueOrDefault(id, "Unknown")
            };
            return new TestCommissionDto
            {
                Id = c.Id,
                EntityType = c.EntityType.ToString(),
                EntityId = id,
                EntityName = name,
                CommissionType = c.CommissionType.ToString(),
                CommissionValue = c.CommissionValue
            };
        }).ToList();
    }
}