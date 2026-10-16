using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.DoctorClinic.Commands.BookAppointment;

public class BookAppointmentCommandHandler : IRequestHandler<BookAppointmentCommand, BookAppointmentResult>
{
    private readonly IApplicationDbContext _db;

    public BookAppointmentCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<BookAppointmentResult> Handle(BookAppointmentCommand request, CancellationToken cancellationToken)
    {
        var doctorActive = await _db.Doctors
            .AnyAsync(d => d.Id == request.DoctorId && d.Status == PlatformRecordStatus.Active, cancellationToken);
        if (!doctorActive)
            throw new ConflictException("This doctor is not active, so new bookings cannot be taken.");

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

        // ---- Serial number + capacity check must be atomic ----
        // Two receptionists booking at the same moment must not get the same serial
        // (or overfill a slot). A transaction-scoped advisory lock on
        // (doctor, branch, date) serialises just those bookings; it is released
        // automatically on commit/rollback.
        var lockKey = $"clinic-booking:{request.DoctorId}:{request.BranchId}:{request.BookingDate:yyyy-MM-dd}";

        await using var tx = await _db.Database.BeginTransactionAsync(cancellationToken);

        await _db.Database.ExecuteSqlInterpolatedAsync(
            $"SELECT pg_advisory_xact_lock(hashtextextended({lockKey}, 0::bigint))",
            cancellationToken);

        var currentBookedCount = await _db.DoctorClinicBookings
            .CountAsync(b => b.DoctorId == request.DoctorId
                           && b.BranchId == request.BranchId
                           && b.BookingDate == request.BookingDate
                           && b.TimeSlot == request.TimeSlot
                           && b.Status == BookingStatusType.Booked,
                        cancellationToken);

        if (currentBookedCount >= schedule.MaxPatients)
            throw new ConflictException("This time slot is fully booked.");

        // Highest serial ever issued for this doctor/branch/day (cancelled ones included,
        // so a serial number is never handed out twice).
        var lastSerial = await _db.DoctorClinicBookings
            .Where(b => b.DoctorId == request.DoctorId
                     && b.BranchId == request.BranchId
                     && b.BookingDate == request.BookingDate)
            .MaxAsync(b => (int?)b.SerialNo, cancellationToken) ?? 0;

        var hasFee = request.VisitFee > 0;
        PaymentMethodType? paymentMethod = null;
        if (hasFee && Enum.TryParse<PaymentMethodType>(request.PaymentMethod, ignoreCase: true, out var parsed))
            paymentMethod = parsed;

        var booking = new DoctorClinicBooking
        {
            Id = Guid.NewGuid(),
            ScheduleId = schedule.Id,
            DoctorId = request.DoctorId,
            BranchId = request.BranchId,
            BookingDate = request.BookingDate,
            TimeSlot = request.TimeSlot,
            SerialNo = lastSerial + 1,
            PatientName = request.PatientName.Trim(),
            PatientPhone = request.PatientPhone.Trim(),
            PatientEmail = string.IsNullOrWhiteSpace(request.PatientEmail) ? null : request.PatientEmail.Trim(),
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            VisitFee = hasFee ? request.VisitFee : 0m,
            PaymentMethod = paymentMethod,
            Status = BookingStatusType.Booked,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.DoctorClinicBookings.Add(booking);
        await _db.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        return new BookAppointmentResult { Id = booking.Id, SerialNo = booking.SerialNo!.Value };
    }
}