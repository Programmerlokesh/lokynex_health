using FluentValidation;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Clinics;

// Same behaviour as the lab's "Doctor Clinic" (schedules -> slots -> booking with serial number),
// but scoped to ONE clinic and its own doctors, and the visit fee posts to the clinic ledger.

public static class ClinicPay
{
    public static readonly string[] Methods = { "Cash", "Card", "UPI" };
    public static string? Normalize(string? m) =>
        Methods.FirstOrDefault(x => string.Equals(x, m?.Trim(), StringComparison.OrdinalIgnoreCase));
}

// ------------------------------ schedules ------------------------------
public class ClinicScheduleDto
{
    public Guid Id { get; set; }
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = default!;
    public short DayOfWeek { get; set; }
    public int SlotMinutes { get; set; }
    public TimeOnly TimeFrom { get; set; }
    public TimeOnly TimeTo { get; set; }
    public int MaxPatients { get; set; }
    public bool IsActive { get; set; }
}

public class GetClinicSchedulesQuery : IRequest<List<ClinicScheduleDto>> { public Guid? DoctorId { get; set; } }

public class GetClinicSchedulesQueryHandler : IRequestHandler<GetClinicSchedulesQuery, List<ClinicScheduleDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public GetClinicSchedulesQueryHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task<List<ClinicScheduleDto>> Handle(GetClinicSchedulesQuery r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var q = _db.ClinicSchedules.AsNoTracking().Where(s => s.ClinicId == cid);
        if (r.DoctorId.HasValue) q = q.Where(s => s.DoctorId == r.DoctorId.Value);
        var rows = await q.OrderBy(s => s.DayOfWeek).ThenBy(s => s.TimeFrom).ToListAsync(ct);

        var names = await _db.ClinicDoctors.AsNoTracking().Where(d => d.ClinicId == cid)
            .ToDictionaryAsync(d => d.Id, d => d.FullName, ct);   // O(1) name lookups
        return rows.Select(s => new ClinicScheduleDto
        {
            Id = s.Id, DoctorId = s.DoctorId, DoctorName = names.GetValueOrDefault(s.DoctorId, "Unknown"),
            DayOfWeek = s.DayOfWeek, SlotMinutes = s.SlotMinutes, TimeFrom = s.TimeFrom, TimeTo = s.TimeTo,
            MaxPatients = s.MaxPatients, IsActive = s.IsActive
        }).ToList();
    }
}

public class CreateClinicScheduleCommand : IRequest<Guid>
{
    public Guid DoctorId { get; set; }
    public short DayOfWeek { get; set; }
    public int SlotMinutes { get; set; }
    public TimeOnly TimeFrom { get; set; }
    public TimeOnly TimeTo { get; set; }
    public int MaxPatients { get; set; }
}

public class CreateClinicScheduleCommandValidator : AbstractValidator<CreateClinicScheduleCommand>
{
    public CreateClinicScheduleCommandValidator()
    {
        RuleFor(x => x.DoctorId).NotEmpty();
        RuleFor(x => x.DayOfWeek).InclusiveBetween((short)0, (short)6);
        RuleFor(x => x.SlotMinutes).InclusiveBetween(5, 240);
        RuleFor(x => x.MaxPatients).InclusiveBetween(1, 100);
        RuleFor(x => x).Must(x => x.TimeTo > x.TimeFrom).WithMessage("End time must be after start time.");
    }
}

public class CreateClinicScheduleCommandHandler : IRequestHandler<CreateClinicScheduleCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public CreateClinicScheduleCommandHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task<Guid> Handle(CreateClinicScheduleCommand r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        if (!await _db.ClinicDoctors.AnyAsync(d => d.Id == r.DoctorId && d.ClinicId == cid && d.Status == ClinicStatus.Active, ct))
            throw new ConflictException("Choose an active doctor of this clinic.");

        // Two sessions of one doctor on one day must not overlap.
        var overlap = await _db.ClinicSchedules.AnyAsync(s => s.ClinicId == cid && s.DoctorId == r.DoctorId
            && s.DayOfWeek == r.DayOfWeek && s.IsActive && s.TimeFrom < r.TimeTo && r.TimeFrom < s.TimeTo, ct);
        if (overlap) throw new ConflictException("This doctor already has a session that overlaps these hours.");

        var s = new ClinicSchedule
        {
            Id = Guid.NewGuid(), ClinicId = cid, DoctorId = r.DoctorId, DayOfWeek = r.DayOfWeek,
            SlotMinutes = r.SlotMinutes, TimeFrom = r.TimeFrom, TimeTo = r.TimeTo, MaxPatients = r.MaxPatients,
            IsActive = true, CreatedAt = DateTimeOffset.UtcNow
        };
        _db.ClinicSchedules.Add(s);
        await _db.SaveChangesAsync(ct);
        return s.Id;
    }
}

public class ToggleClinicScheduleCommand : IRequest
{
    public Guid Id { get; set; }
    public bool IsActive { get; set; }
}

public class ToggleClinicScheduleCommandHandler : IRequestHandler<ToggleClinicScheduleCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public ToggleClinicScheduleCommandHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task Handle(ToggleClinicScheduleCommand r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var s = await _db.ClinicSchedules.FirstOrDefaultAsync(x => x.Id == r.Id && x.ClinicId == cid, ct)
                ?? throw new NotFoundException("Schedule", r.Id);
        s.IsActive = r.IsActive;
        s.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}

// ------------------------------ available slots ------------------------------
public class ClinicSlotDto
{
    public TimeOnly TimeSlot { get; set; }
    public int MaxPatients { get; set; }
    public int BookedCount { get; set; }
    public int AvailableCount { get; set; }
    public bool IsFull => AvailableCount <= 0;
}

public class GetClinicSlotsQuery : IRequest<List<ClinicSlotDto>>
{
    public Guid DoctorId { get; set; }
    public DateOnly Date { get; set; }
}

public class GetClinicSlotsQueryHandler : IRequestHandler<GetClinicSlotsQuery, List<ClinicSlotDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public GetClinicSlotsQueryHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task<List<ClinicSlotDto>> Handle(GetClinicSlotsQuery r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var dow = (short)r.Date.DayOfWeek;   // .NET: Sunday = 0 ... Saturday = 6, same as the schema

        var sessions = await _db.ClinicSchedules.AsNoTracking()
            .Where(s => s.ClinicId == cid && s.DoctorId == r.DoctorId && s.DayOfWeek == dow && s.IsActive)
            .OrderBy(s => s.TimeFrom).ToListAsync(ct);
        if (sessions.Count == 0) return new List<ClinicSlotDto>();

        // ONE query for the day's bookings, grouped in memory into slot -> count (O(1) lookups, no N+1).
        var booked = (await _db.ClinicBookings.AsNoTracking()
                .Where(b => b.ClinicId == cid && b.DoctorId == r.DoctorId && b.BookingDate == r.Date
                         && b.Status != BookingStatus.Cancelled)
                .Select(b => b.TimeSlot).ToListAsync(ct))
            .GroupBy(t => t).ToDictionary(g => g.Key, g => g.Count());

        var result = new List<ClinicSlotDto>();
        foreach (var s in sessions)
            for (var t = s.TimeFrom; t < s.TimeTo; t = t.AddMinutes(s.SlotMinutes))
            {
                var n = booked.GetValueOrDefault(t, 0);
                result.Add(new ClinicSlotDto { TimeSlot = t, MaxPatients = s.MaxPatients, BookedCount = n, AvailableCount = s.MaxPatients - n });
                if (t.AddMinutes(s.SlotMinutes) <= t) break;   // guards the TimeOnly wrap-around at midnight
            }
        return result;
    }
}

// ------------------------------ book ------------------------------
public class BookClinicAppointmentCommand : IRequest<BookClinicAppointmentResult>
{
    public Guid DoctorId { get; set; }
    public DateOnly BookingDate { get; set; }
    public TimeOnly TimeSlot { get; set; }
    public string PatientName { get; set; } = default!;
    public string PatientPhone { get; set; } = default!;
    public string? PatientEmail { get; set; }
    public int? PatientAge { get; set; }
    public string? PatientGender { get; set; }
    public string? Note { get; set; }
    public decimal VisitFee { get; set; }
    public string? PaymentMethod { get; set; }
}

public class BookClinicAppointmentResult
{
    public Guid Id { get; set; }
    public int SerialNo { get; set; }
}

public class BookClinicAppointmentCommandValidator : AbstractValidator<BookClinicAppointmentCommand>
{
    public BookClinicAppointmentCommandValidator()
    {
        RuleFor(x => x.DoctorId).NotEmpty();
        RuleFor(x => x.PatientName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.PatientPhone).RequiredMobile();
        RuleFor(x => x.PatientEmail).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.PatientEmail));
        RuleFor(x => x.PatientAge).InclusiveBetween(0, 130).When(x => x.PatientAge.HasValue);
        RuleFor(x => x.Note).MaximumLength(1000);
        RuleFor(x => x.VisitFee).InclusiveBetween(0m, 1_000_000m);
        RuleFor(x => x.PaymentMethod).NotEmpty().When(x => x.VisitFee > 0).WithMessage("Select a payment method for the visit fee.");
        RuleFor(x => x.PaymentMethod).Must(m => ClinicPay.Normalize(m) is not null)
            .When(x => !string.IsNullOrWhiteSpace(x.PaymentMethod)).WithMessage("Payment method must be Cash, Card or UPI.");
    }
}

public class BookClinicAppointmentCommandHandler : IRequestHandler<BookClinicAppointmentCommand, BookClinicAppointmentResult>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public BookClinicAppointmentCommandHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task<BookClinicAppointmentResult> Handle(BookClinicAppointmentCommand r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var doctor = await _db.ClinicDoctors.AsNoTracking()
            .Where(d => d.Id == r.DoctorId && d.ClinicId == cid).Select(d => new { d.Status, d.FullName }).FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("Doctor", r.DoctorId);
        if (doctor.Status != ClinicStatus.Active)
            throw new ConflictException("This doctor is not active, so new bookings cannot be taken.");

        var dow = (short)r.BookingDate.DayOfWeek;
        var schedule = await _db.ClinicSchedules.FirstOrDefaultAsync(s => s.ClinicId == cid && s.DoctorId == r.DoctorId
            && s.DayOfWeek == dow && s.IsActive && r.TimeSlot >= s.TimeFrom && r.TimeSlot < s.TimeTo, ct)
            ?? throw new ConflictException("The doctor does not hold chamber at that time.");

        // Capacity check + serial number must be atomic: a transaction-scoped advisory lock on
        // (clinic, doctor, date) serialises just those bookings and is released on commit.
        var lockKey = $"clinic-booking:{cid}:{r.DoctorId}:{r.BookingDate:yyyy-MM-dd}";
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        await _db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({lockKey}, 0::bigint))", ct);

        var inSlot = await _db.ClinicBookings.CountAsync(b => b.ClinicId == cid && b.DoctorId == r.DoctorId
            && b.BookingDate == r.BookingDate && b.TimeSlot == r.TimeSlot && b.Status != BookingStatus.Cancelled, ct);
        if (inSlot >= schedule.MaxPatients) throw new ConflictException("This time slot is fully booked.");

        // Highest serial ever issued that day (cancelled included) so a serial is never handed out twice.
        var last = await _db.ClinicBookings.Where(b => b.ClinicId == cid && b.DoctorId == r.DoctorId && b.BookingDate == r.BookingDate)
            .MaxAsync(b => (int?)b.SerialNo, ct) ?? 0;

        var hasFee = r.VisitFee > 0;
        var method = hasFee ? ClinicPay.Normalize(r.PaymentMethod) : null;
        var now = DateTimeOffset.UtcNow;
        var booking = new ClinicBooking
        {
            Id = Guid.NewGuid(), ClinicId = cid, ScheduleId = schedule.Id, DoctorId = r.DoctorId,
            BookingDate = r.BookingDate, TimeSlot = r.TimeSlot, SerialNo = last + 1,
            PatientName = r.PatientName.Trim(), PatientPhone = ClinicRules.Mobile(r.PatientPhone)!,
            PatientEmail = ClinicScope.Clean(r.PatientEmail), PatientAge = r.PatientAge,
            PatientGender = ClinicScope.Clean(r.PatientGender), Note = ClinicScope.Clean(r.Note),
            VisitFee = hasFee ? Math.Round(r.VisitFee, 2) : 0m, PaymentMethod = method,
            Status = BookingStatus.Booked, CreatedBy = _user.UserId, CreatedAt = now
        };
        _db.ClinicBookings.Add(booking);

        if (hasFee)
            _db.ClinicLedgerEntries.Add(new ClinicLedgerEntry
            {
                Id = Guid.NewGuid(), ClinicId = cid, EntryDate = ClinicScope.Today(),
                EntryType = "Income", Category = "Consultation fee", Amount = booking.VisitFee,
                PaymentMethod = method, Description = $"Visit fee · {booking.PatientName} · {doctor.FullName} · #{booking.SerialNo}",
                Source = "Booking", ReferenceId = booking.Id, CreatedBy = _user.UserId, CreatedAt = now
            });

        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return new BookClinicAppointmentResult { Id = booking.Id, SerialNo = booking.SerialNo };
    }
}

// ------------------------------ list bookings ------------------------------
public class ClinicBookingDto
{
    public Guid Id { get; set; }
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = default!;
    public DateOnly BookingDate { get; set; }
    public TimeOnly TimeSlot { get; set; }
    public int SerialNo { get; set; }
    public string PatientName { get; set; } = default!;
    public string PatientPhone { get; set; } = default!;
    public string? PatientEmail { get; set; }
    public int? PatientAge { get; set; }
    public string? PatientGender { get; set; }
    public string? Reason { get; set; }
    public decimal VisitFee { get; set; }
    public string? PaymentMethod { get; set; }
    public string Status { get; set; } = default!;
    public Guid? PrescriptionId { get; set; }
}

public class GetClinicBookingsQuery : IRequest<List<ClinicBookingDto>>
{
    public DateOnly Date { get; set; }
    /// <summary>Null = every doctor of the clinic.</summary>
    public Guid? DoctorId { get; set; }
}

public class GetClinicBookingsQueryHandler : IRequestHandler<GetClinicBookingsQuery, List<ClinicBookingDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public GetClinicBookingsQueryHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task<List<ClinicBookingDto>> Handle(GetClinicBookingsQuery r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var q = _db.ClinicBookings.AsNoTracking().Where(b => b.ClinicId == cid && b.BookingDate == r.Date);
        if (r.DoctorId.HasValue) q = q.Where(b => b.DoctorId == r.DoctorId.Value);
        var rows = await q.ToListAsync(ct);

        var names = await _db.ClinicDoctors.AsNoTracking().Where(d => d.ClinicId == cid)
            .ToDictionaryAsync(d => d.Id, d => d.FullName, ct);
        return rows.Select(b => new ClinicBookingDto
        {
            Id = b.Id, DoctorId = b.DoctorId, DoctorName = names.GetValueOrDefault(b.DoctorId, "Unknown"),
            BookingDate = b.BookingDate, TimeSlot = b.TimeSlot, SerialNo = b.SerialNo, PatientName = b.PatientName,
            PatientPhone = b.PatientPhone, PatientEmail = b.PatientEmail, PatientAge = b.PatientAge,
            PatientGender = b.PatientGender, Reason = b.Note, VisitFee = b.VisitFee, PaymentMethod = b.PaymentMethod,
            Status = b.Status, PrescriptionId = b.PrescriptionId
        }).OrderBy(d => d.DoctorName).ThenBy(d => d.SerialNo).ToList();
    }
}

// ------------------------------ cancel ------------------------------
public class CancelClinicBookingCommand : IRequest { public Guid Id { get; set; } }

public class CancelClinicBookingCommandHandler : IRequestHandler<CancelClinicBookingCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public CancelClinicBookingCommandHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task Handle(CancelClinicBookingCommand r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var b = await _db.ClinicBookings.FirstOrDefaultAsync(x => x.Id == r.Id && x.ClinicId == cid, ct)
                ?? throw new NotFoundException("Booking", r.Id);
        if (b.Status == BookingStatus.Cancelled) return;
        if (b.Status == BookingStatus.Completed)
            throw new ConflictException("A visit with a prescription cannot be cancelled.");

        b.Status = BookingStatus.Cancelled;
        b.UpdatedAt = DateTimeOffset.UtcNow;

        // Money already collected is returned through a Refund entry (the Income entry stays for the audit trail).
        if (b.VisitFee > 0)
            _db.ClinicLedgerEntries.Add(new ClinicLedgerEntry
            {
                Id = Guid.NewGuid(), ClinicId = cid, EntryDate = ClinicScope.Today(), EntryType = "Refund",
                Category = "Consultation fee", Amount = b.VisitFee, PaymentMethod = b.PaymentMethod,
                Description = $"Cancelled booking · {b.PatientName} · #{b.SerialNo}",
                Source = "BookingRefund", ReferenceId = b.Id, CreatedBy = _user.UserId, CreatedAt = DateTimeOffset.UtcNow
            });
        await _db.SaveChangesAsync(ct);
    }
}