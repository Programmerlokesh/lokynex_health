using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.DoctorClinic.Queries.GetBookings;

public class GetBookingsQueryHandler : IRequestHandler<GetBookingsQuery, List<BookingDto>>
{
    private readonly IApplicationDbContext _db;

    public GetBookingsQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<BookingDto>> Handle(GetBookingsQuery request, CancellationToken cancellationToken)
    {
        var query = _db.DoctorClinicBookings.AsNoTracking()
            .Where(b => b.DoctorId == request.DoctorId && b.BookingDate == request.Date);

        if (request.BranchId.HasValue)
            query = query.Where(b => b.BranchId == request.BranchId.Value);

        var rows = await query.ToListAsync(cancellationToken);

        // Branch names: one batch query + dictionary lookup (same pattern as the schedules query).
        var branchIds = rows.Select(r => r.BranchId).Distinct().ToList();
        var branchNames = branchIds.Count == 0
            ? new Dictionary<Guid, string>()
            : await _db.Branches.AsNoTracking()
                .Where(b => branchIds.Contains(b.Id))
                .ToDictionaryAsync(b => b.Id, b => b.BranchName, cancellationToken);

        // Queue order: branch, then serial number, then slot time.
        return rows
            .Select(r => new BookingDto
            {
                Id = r.Id,
                DoctorId = r.DoctorId,
                BranchId = r.BranchId,
                BranchName = branchNames.GetValueOrDefault(r.BranchId, "Unknown"),
                BookingDate = r.BookingDate,
                TimeSlot = r.TimeSlot,
                SerialNo = r.SerialNo,
                PatientName = r.PatientName,
                PatientPhone = r.PatientPhone,
                Reason = r.Note,
                VisitFee = r.VisitFee,
                PaymentMethod = r.PaymentMethod?.ToString(),
                Status = r.Status.ToString()
            })
            .OrderBy(d => d.BranchName)
            .ThenBy(d => d.SerialNo ?? int.MaxValue)
            .ThenBy(d => d.TimeSlot)
            .ToList();
    }
}