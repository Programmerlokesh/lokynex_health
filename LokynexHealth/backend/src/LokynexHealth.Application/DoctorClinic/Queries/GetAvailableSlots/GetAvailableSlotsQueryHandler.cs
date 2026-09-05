using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.DoctorClinic.Queries.GetAvailableSlots;

public class GetAvailableSlotsQueryHandler : IRequestHandler<GetAvailableSlotsQuery, List<AvailableSlotDto>>
{
    private readonly IApplicationDbContext _db;

    public GetAvailableSlotsQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<AvailableSlotDto>> Handle(GetAvailableSlotsQuery request, CancellationToken cancellationToken)
    {
        // ---------- 1. Resolve day-of-week from the requested date ----------
        // .NET's DayOfWeek enum is Sunday=0..Saturday=6 — matches our schema's convention exactly,
        // so no manual offset math needed (a common off-by-one bug source if conventions differ).
        var dayOfWeek = (short)request.Date.DayOfWeek;

        var schedule = await _db.DoctorClinicSchedules
            .Where(s => s.DoctorId == request.DoctorId
                     && s.BranchId == request.BranchId
                     && s.DayOfWeek == dayOfWeek
                     && s.IsActive)
            .FirstOrDefaultAsync(cancellationToken);

        if (schedule is null)
            return new List<AvailableSlotDto>();   // doctor doesn't hold clinic on this day — empty, not an error

        // ---------- 2. Generate every possible slot time — O(n) where n = number of slots ----------
        // Classic "generate a sequence with a fixed step" pattern: start at TimeFrom,
        // keep adding SlotMinutes until we reach TimeTo. Bounded loop (n is small — a clinic
        // day rarely has more than ~50 slots), so this is cheap even without any clever trick.
        var allSlots = new List<TimeOnly>();
        var cursor = schedule.TimeFrom;
        while (cursor < schedule.TimeTo)
        {
            allSlots.Add(cursor);
            cursor = cursor.AddMinutes(schedule.SlotMinutes);
        }

        // ---------- 3. Batch fetch existing bookings for this doctor+date — ONE query ----------
        var existingBookings = await _db.DoctorClinicBookings
            .Where(b => b.DoctorId == request.DoctorId
                     && b.BranchId == request.BranchId
                     && b.BookingDate == request.Date
                     && b.Status == BookingStatusType.Booked)
            .Select(b => b.TimeSlot)
            .ToListAsync(cancellationToken);

        // ---------- 4. Build a Dictionary<TimeOnly, int> booked-count-per-slot — O(1) lookup ----------
        // Instead of, for each generated slot, running a separate COUNT query against the
        // bookings table (N+1 — Day 3's core lesson), we group the already-fetched bookings
        // ONCE in memory into a lookup table, then every slot's count check below is O(1).
        var bookedCountBySlot = existingBookings
            .GroupBy(t => t)
            .ToDictionary(g => g.Key, g => g.Count());

        // ---------- 5. Single O(n) pass combining generated slots with booked counts ----------
        return allSlots.Select(slot =>
        {
            var bookedCount = bookedCountBySlot.GetValueOrDefault(slot, 0);   // O(1), defaults to 0 if no bookings yet
            return new AvailableSlotDto
            {
                TimeSlot = slot,
                MaxPatients = schedule.MaxPatients,
                BookedCount = bookedCount,
                AvailableCount = schedule.MaxPatients - bookedCount
            };
        }).ToList();
    }
}