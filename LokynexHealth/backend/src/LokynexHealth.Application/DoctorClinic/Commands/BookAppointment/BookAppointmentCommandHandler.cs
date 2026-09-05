using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.DoctorClinic.Commands.BookAppointment;

public class BookAppointmentCommandHandler : IRequestHandler<BookAppointmentCommand, Guid>
{
    private readonly IApplicationDbContext _db;

    public BookAppointmentCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Guid> Handle(BookAppointmentCommand request, CancellationToken cancellationToken)
    {
        var dayOfWeek = (short)request.BookingDate.DayOfWeek;

        var schedule = await _db.DoctorClinicSchedules
            .Where(s => s.DoctorId == request.DoctorId
                     && s.BranchId == request.BranchId
                     && s.DayOfWeek == dayOfWeek
                     && s.IsActive)
            .FirstOrDefaultAsync(cancellationToken);

        if (schedule is null)
            throw new ConflictException("Doctor does not hold clinic hours on this day.");

        if (request.TimeSlot < schedule.TimeFrom || request.TimeSlot >= schedule.TimeTo)
            throw new ConflictException("Requested time slot is outside the doctor's clinic hours.");

        // Capacity check — count existing bookings for this exact slot, compare against max_patients.
        var currentBookedCount = await _db.DoctorClinicBookings
            .CountAsync(b => b.DoctorId == request.DoctorId
                           && b.BranchId == request.BranchId
                           && b.BookingDate == request.BookingDate
                           && b.TimeSlot == request.TimeSlot
                           && b.Status == BookingStatusType.Booked,
                        cancellationToken);

        if (currentBookedCount >= schedule.MaxPatients)
            throw new ConflictException("This time slot is fully booked.");

        var booking = new DoctorClinicBooking
        {
            Id = Guid.NewGuid(),
            ScheduleId = schedule.Id,
            DoctorId = request.DoctorId,
            BranchId = request.BranchId,
            BookingDate = request.BookingDate,
            TimeSlot = request.TimeSlot,
            PatientName = request.PatientName,
            PatientPhone = request.PatientPhone,
            PatientEmail = request.PatientEmail,
            Note = request.Note,
            Status = BookingStatusType.Booked,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.DoctorClinicBookings.Add(booking);
        await _db.SaveChangesAsync(cancellationToken);

        return booking.Id;
    }
}