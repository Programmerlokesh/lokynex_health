using FluentValidation;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Clinics;

public class ClinicPrescriptionListItem
{
    public Guid Id { get; set; }
    public string RxNo { get; set; } = default!;
    public DateOnly VisitDate { get; set; }
    public string PatientName { get; set; } = default!;
    public int? PatientAge { get; set; }
    public string PatientPhone { get; set; } = default!;
    public string DoctorName { get; set; } = default!;
    public string? Diagnosis { get; set; }
    public int MedicineCount { get; set; }
    public int TestCount { get; set; }
}

/// <summary>One medicine row — used both when saving and when reading.</summary>
public class RxItemDto
{
    public Guid? MedicineId { get; set; }
    public string Name { get; set; } = default!;
    public string? Company { get; set; }
    public string? Composition { get; set; }
    public string? Form { get; set; }
    public string? Dosage { get; set; }
    public string? Duration { get; set; }
    public string? Instructions { get; set; }
}

public class RxTestDto
{
    public Guid? TestId { get; set; }
    public string Name { get; set; } = default!;
    public string? DepartmentName { get; set; }
    public string? Note { get; set; }
}

public class ClinicPrescriptionDto
{
    public Guid Id { get; set; }
    public string RxNo { get; set; } = default!;
    public DateOnly VisitDate { get; set; }
    public Guid? DoctorId { get; set; }
    public string DoctorName { get; set; } = default!;
    public string? DoctorQualification { get; set; }
    public string? DoctorSpecialization { get; set; }
    public string? DoctorRegNo { get; set; }
    public Guid? PatientId { get; set; }
    public string PatientName { get; set; } = default!;
    public int? PatientAge { get; set; }
    public string? PatientGender { get; set; }
    public string PatientPhone { get; set; } = default!;
    public string? PatientWhatsapp { get; set; }
    public string? PatientEmail { get; set; }
    public string? PatientAddress { get; set; }
    public string? PatientPincode { get; set; }
    public Guid? BookingId { get; set; }
    public string? Referral { get; set; }
    public string? ChiefComplaints { get; set; }
    public string? Diagnosis { get; set; }
    public string? Bp { get; set; }
    public string? Pulse { get; set; }
    public string? Temperature { get; set; }
    public string? Weight { get; set; }
    public string? Spo2 { get; set; }
    public string? GeneralAdvice { get; set; }
    public DateOnly? FollowUpDate { get; set; }
    public string? FollowUpNote { get; set; }
    public List<RxItemDto> Items { get; set; } = new();
    public List<RxTestDto> Tests { get; set; } = new();
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}

// ------------------------------ save (create + edit) ------------------------------
public class SaveClinicPrescriptionCommand : IRequest<SaveClinicPrescriptionResult>
{
    /// <summary>Null = new prescription, otherwise edit.</summary>
    public Guid? Id { get; set; }
    public Guid DoctorId { get; set; }
    public DateOnly VisitDate { get; set; }

    public Guid? PatientId { get; set; }
    public string PatientName { get; set; } = default!;
    public int? PatientAge { get; set; }
    public string? PatientGender { get; set; }
    public string PatientPhone { get; set; } = default!;
    /// <summary>Empty = same as the mobile number.</summary>
    public string? PatientWhatsapp { get; set; }
    public string? PatientEmail { get; set; }
    public string? PatientAddress { get; set; }
    public string? PatientPincode { get; set; }

    public Guid? BookingId { get; set; }
    public string? Referral { get; set; }
    public string? ChiefComplaints { get; set; }
    public string? Diagnosis { get; set; }
    public string? Bp { get; set; }
    public string? Pulse { get; set; }
    public string? Temperature { get; set; }
    public string? Weight { get; set; }
    public string? Spo2 { get; set; }
    public string? GeneralAdvice { get; set; }
    public DateOnly? FollowUpDate { get; set; }
    public string? FollowUpNote { get; set; }

    public List<RxItemDto> Items { get; set; } = new();
    public List<RxTestDto> Tests { get; set; } = new();
}

public class SaveClinicPrescriptionResult
{
    public Guid Id { get; set; }
    public string RxNo { get; set; } = default!;
}

public class SaveClinicPrescriptionCommandValidator : AbstractValidator<SaveClinicPrescriptionCommand>
{
    public SaveClinicPrescriptionCommandValidator()
    {
        RuleFor(x => x.DoctorId).NotEmpty().WithMessage("Choose the doctor.");
        RuleFor(x => x.VisitDate).Must(d => d.Year >= 2000 && d <= ClinicScope.Today().AddDays(2))
            .WithMessage("Visit date is out of range.");
        RuleFor(x => x.PatientName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.PatientPhone).RequiredMobile();
        RuleFor(x => x.PatientWhatsapp).OptionalMobile();
        RuleFor(x => x.PatientAge).InclusiveBetween(0, 130).When(x => x.PatientAge.HasValue);
        RuleFor(x => x.PatientGender).MaximumLength(10);
        RuleFor(x => x.PatientEmail).EmailAddress().MaximumLength(150).When(x => !string.IsNullOrWhiteSpace(x.PatientEmail));
        RuleFor(x => x.PatientPincode).MaximumLength(10);
        RuleFor(x => x.Referral).MaximumLength(200);
        RuleFor(x => x.Bp).MaximumLength(20);
        RuleFor(x => x.Pulse).MaximumLength(20);
        RuleFor(x => x.Temperature).MaximumLength(20);
        RuleFor(x => x.Weight).MaximumLength(20);
        RuleFor(x => x.Spo2).MaximumLength(20);
        RuleFor(x => x.FollowUpNote).MaximumLength(300);
        RuleFor(x => x.Items).Must(l => l.Count <= 40).WithMessage("At most 40 medicines per prescription.");
        RuleFor(x => x.Tests).Must(l => l.Count <= 40).WithMessage("At most 40 tests per prescription.");
        RuleForEach(x => x.Items).ChildRules(i =>
        {
            i.RuleFor(y => y.Name).NotEmpty().WithMessage("Every medicine row needs a name.").MaximumLength(200);
            i.RuleFor(y => y.Company).MaximumLength(150);
            i.RuleFor(y => y.Composition).MaximumLength(500);
            i.RuleFor(y => y.Form).MaximumLength(40);
            i.RuleFor(y => y.Dosage).MaximumLength(80);
            i.RuleFor(y => y.Duration).MaximumLength(80);
            i.RuleFor(y => y.Instructions).MaximumLength(200);
        });
        RuleForEach(x => x.Tests).ChildRules(t =>
        {
            t.RuleFor(y => y.Name).NotEmpty().WithMessage("Every test needs a name.").MaximumLength(200);
            t.RuleFor(y => y.DepartmentName).MaximumLength(150);
            t.RuleFor(y => y.Note).MaximumLength(200);
        });
    }
}

public class SaveClinicPrescriptionCommandHandler : IRequestHandler<SaveClinicPrescriptionCommand, SaveClinicPrescriptionResult>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public SaveClinicPrescriptionCommandHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    private static string Key(string name, string? company) => $"{name.Trim().ToLowerInvariant()}|{(company ?? "").Trim().ToLowerInvariant()}";

    public async Task<SaveClinicPrescriptionResult> Handle(SaveClinicPrescriptionCommand r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var doctor = await _db.ClinicDoctors.AsNoTracking().FirstOrDefaultAsync(d => d.Id == r.DoctorId && d.ClinicId == cid, ct)
                     ?? throw new NotFoundException("Doctor", r.DoctorId);

        var phone = ClinicRules.Mobile(r.PatientPhone)!;
        var whatsapp = ClinicRules.Mobile(r.PatientWhatsapp) ?? phone;   // "same as mobile" by default
        var now = DateTimeOffset.UtcNow;
        var isNew = r.Id is null;

        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        // One lock per clinic: two people saving at the same moment can never get the same Rx number
        // or create the same patient twice.
        var lockKey = $"clinic-rx:{cid}";
        await _db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({lockKey}, 0::bigint))", ct);

        // ---------- patient: reuse by id, else by mobile + name, else create ----------
        ClinicPatient? patient = null;
        if (r.PatientId is { } pid)
            patient = await _db.ClinicPatients.FirstOrDefaultAsync(p => p.Id == pid && p.ClinicId == cid, ct);
        if (patient is null)
        {
            var lower = r.PatientName.Trim().ToLower();
            patient = await _db.ClinicPatients.FirstOrDefaultAsync(p => p.ClinicId == cid && p.Phone == phone && p.Name.ToLower() == lower, ct);
        }
        if (patient is null)
        {
            patient = new ClinicPatient { Id = Guid.NewGuid(), ClinicId = cid, CreatedAt = now };
            _db.ClinicPatients.Add(patient);
        }
        else patient.UpdatedAt = now;
        patient.Name = r.PatientName.Trim();
        patient.Age = r.PatientAge;
        patient.Gender = ClinicScope.Clean(r.PatientGender);
        patient.Phone = phone;
        patient.WhatsappNumber = whatsapp;
        patient.Email = ClinicScope.Clean(r.PatientEmail);
        patient.Address = ClinicScope.Clean(r.PatientAddress);
        patient.Pincode = ClinicScope.Clean(r.PatientPincode);
        patient.LastVisitAt = now;

        // ---------- prescription ----------
        ClinicPrescription rx;
        if (r.Id is { } id)
        {
            rx = await _db.ClinicPrescriptions.Include(p => p.Items).Include(p => p.Tests)
                     .FirstOrDefaultAsync(p => p.Id == id && p.ClinicId == cid, ct)
                 ?? throw new NotFoundException("Prescription", id);
            _db.ClinicPrescriptionItems.RemoveRange(rx.Items.ToList());
            _db.ClinicPrescriptionTests.RemoveRange(rx.Tests.ToList());
            rx.UpdatedAt = now;
            rx.UpdatedBy = _user.UserId;
        }
        else
        {
            var serial = (await _db.ClinicPrescriptions.Where(p => p.ClinicId == cid).MaxAsync(p => (int?)p.RxSerial, ct) ?? 0) + 1;
            rx = new ClinicPrescription
            {
                Id = Guid.NewGuid(),
                ClinicId = cid,
                RxSerial = serial,
                RxNo = $"RX{serial:D6}",
                CreatedAt = now,
                CreatedBy = _user.UserId
            };
            _db.ClinicPrescriptions.Add(rx);
        }

        rx.VisitDate = r.VisitDate;
        rx.DoctorId = doctor.Id;
        rx.DoctorName = doctor.FullName;
        rx.DoctorQualification = doctor.Qualification;
        rx.DoctorSpecialization = doctor.Specialization;
        rx.DoctorRegNo = doctor.RegistrationNo;
        rx.PatientId = patient.Id;
        rx.PatientName = patient.Name;
        rx.PatientAge = patient.Age;
        rx.PatientGender = patient.Gender;
        rx.PatientPhone = phone;
        rx.PatientWhatsapp = whatsapp;
        rx.PatientEmail = patient.Email;
        rx.PatientAddress = patient.Address;
        rx.PatientPincode = patient.Pincode;
        rx.Referral = ClinicScope.Clean(r.Referral);
        rx.ChiefComplaints = ClinicScope.Clean(r.ChiefComplaints);
        rx.Diagnosis = ClinicScope.Clean(r.Diagnosis);
        rx.Bp = ClinicScope.Clean(r.Bp);
        rx.Pulse = ClinicScope.Clean(r.Pulse);
        rx.Temperature = ClinicScope.Clean(r.Temperature);
        rx.Weight = ClinicScope.Clean(r.Weight);
        rx.Spo2 = ClinicScope.Clean(r.Spo2);
        rx.GeneralAdvice = ClinicScope.Clean(r.GeneralAdvice);
        rx.FollowUpDate = r.FollowUpDate;
        rx.FollowUpNote = ClinicScope.Clean(r.FollowUpNote);

        // ---------- medicines: link to / learn from the clinic formulary ----------
        var rows = r.Items.Where(i => !string.IsNullOrWhiteSpace(i.Name)).ToList();
        var ids = rows.Where(i => i.MedicineId.HasValue).Select(i => i.MedicineId!.Value).Distinct().ToList();
        var lowerNames = rows.Select(i => i.Name.Trim().ToLower()).Distinct().ToList();
        var known = rows.Count == 0
            ? new List<ClinicMedicine>()
            : await _db.ClinicMedicines.Where(m => m.ClinicId == cid && (ids.Contains(m.Id) || lowerNames.Contains(m.BrandName.ToLower()))).ToListAsync(ct);
        var byId = known.ToDictionary(m => m.Id);
        var byKey = new Dictionary<string, ClinicMedicine>();
        foreach (var m in known) byKey.TryAdd(Key(m.BrandName, m.Company), m);

        for (var i = 0; i < rows.Count; i++)
        {
            var it = rows[i];
            var name = it.Name.Trim();
            ClinicMedicine? med = null;
            if (it.MedicineId is { } mid) byId.TryGetValue(mid, out med);
            if (med is null) byKey.TryGetValue(Key(name, it.Company), out med);
            if (med is null)
            {
                med = new ClinicMedicine
                {
                    Id = Guid.NewGuid(),
                    ClinicId = cid,
                    BrandName = name,
                    Company = (it.Company ?? "").Trim(),
                    Composition = ClinicScope.Clean(it.Composition),
                    Form = ClinicScope.Clean(it.Form),
                    DefaultDosage = ClinicScope.Clean(it.Dosage),
                    DefaultDuration = ClinicScope.Clean(it.Duration),
                    DefaultInstructions = ClinicScope.Clean(it.Instructions),
                    Source = "Auto",
                    CreatedAt = now
                };
                _db.ClinicMedicines.Add(med);
                byKey[Key(name, it.Company)] = med;
            }
            if (isNew) med.UsageCount++;

            // children are added through their DbSet so EF always INSERTs them (their Guid is already set)
            _db.ClinicPrescriptionItems.Add(new ClinicPrescriptionItem
            {
                Id = Guid.NewGuid(),
                PrescriptionId = rx.Id,
                SortOrder = i,
                MedicineId = med.Id,
                Name = name,
                Company = ClinicScope.Clean(it.Company),
                Composition = ClinicScope.Clean(it.Composition),
                Form = ClinicScope.Clean(it.Form),
                Dosage = ClinicScope.Clean(it.Dosage),
                Duration = ClinicScope.Clean(it.Duration),
                Instructions = ClinicScope.Clean(it.Instructions),
                CreatedAt = now
            });
        }

        var tests = r.Tests.Where(t => !string.IsNullOrWhiteSpace(t.Name)).ToList();
        for (var i = 0; i < tests.Count; i++)
            _db.ClinicPrescriptionTests.Add(new ClinicPrescriptionTest
            {
                Id = Guid.NewGuid(),
                PrescriptionId = rx.Id,
                SortOrder = i,
                TestId = tests[i].TestId,
                Name = tests[i].Name.Trim(),
                DepartmentName = ClinicScope.Clean(tests[i].DepartmentName),
                Note = ClinicScope.Clean(tests[i].Note),
                CreatedAt = now
            });

        // ---------- link the appointment (visit done) ----------
        if (r.BookingId is { } bid)
        {
            var booking = await _db.ClinicBookings.FirstOrDefaultAsync(b => b.Id == bid && b.ClinicId == cid, ct);
            if (booking is not null && booking.Status != BookingStatus.Cancelled)
            {
                booking.PrescriptionId = rx.Id;
                booking.Status = BookingStatus.Completed;
                booking.UpdatedAt = now;
                rx.BookingId = booking.Id;
            }
        }

        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return new SaveClinicPrescriptionResult { Id = rx.Id, RxNo = rx.RxNo };
    }
}

// ------------------------------ get one ------------------------------
public class GetClinicPrescriptionQuery : IRequest<ClinicPrescriptionDto> { public Guid Id { get; set; } }

public class GetClinicPrescriptionQueryHandler : IRequestHandler<GetClinicPrescriptionQuery, ClinicPrescriptionDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public GetClinicPrescriptionQueryHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task<ClinicPrescriptionDto> Handle(GetClinicPrescriptionQuery r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var p = await _db.ClinicPrescriptions.AsNoTracking().Include(x => x.Items).Include(x => x.Tests)
                    .AsSplitQuery().FirstOrDefaultAsync(x => x.Id == r.Id && x.ClinicId == cid, ct)
                ?? throw new NotFoundException("Prescription", r.Id);
        return new ClinicPrescriptionDto
        {
            Id = p.Id,
            RxNo = p.RxNo,
            VisitDate = p.VisitDate,
            DoctorId = p.DoctorId,
            DoctorName = p.DoctorName,
            DoctorQualification = p.DoctorQualification,
            DoctorSpecialization = p.DoctorSpecialization,
            DoctorRegNo = p.DoctorRegNo,
            PatientId = p.PatientId,
            PatientName = p.PatientName,
            PatientAge = p.PatientAge,
            PatientGender = p.PatientGender,
            PatientPhone = p.PatientPhone,
            PatientWhatsapp = p.PatientWhatsapp,
            PatientEmail = p.PatientEmail,
            PatientAddress = p.PatientAddress,
            PatientPincode = p.PatientPincode,
            BookingId = p.BookingId,
            Referral = p.Referral,
            ChiefComplaints = p.ChiefComplaints,
            Diagnosis = p.Diagnosis,
            Bp = p.Bp,
            Pulse = p.Pulse,
            Temperature = p.Temperature,
            Weight = p.Weight,
            Spo2 = p.Spo2,
            GeneralAdvice = p.GeneralAdvice,
            FollowUpDate = p.FollowUpDate,
            FollowUpNote = p.FollowUpNote,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt,
            Items = p.Items.OrderBy(i => i.SortOrder).Select(i => new RxItemDto
            {
                MedicineId = i.MedicineId,
                Name = i.Name,
                Company = i.Company,
                Composition = i.Composition,
                Form = i.Form,
                Dosage = i.Dosage,
                Duration = i.Duration,
                Instructions = i.Instructions
            }).ToList(),
            Tests = p.Tests.OrderBy(t => t.SortOrder).Select(t => new RxTestDto
            {
                TestId = t.TestId,
                Name = t.Name,
                DepartmentName = t.DepartmentName,
                Note = t.Note
            }).ToList()
        };
    }
}

// ------------------------------ list ------------------------------
public class GetClinicPrescriptionsQuery : IRequest<PagedResult<ClinicPrescriptionListItem>>
{
    public string? Search { get; set; }
    public Guid? DoctorId { get; set; }
    public DateOnly? DateFrom { get; set; }
    public DateOnly? DateTo { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class GetClinicPrescriptionsQueryHandler : IRequestHandler<GetClinicPrescriptionsQuery, PagedResult<ClinicPrescriptionListItem>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public GetClinicPrescriptionsQueryHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task<PagedResult<ClinicPrescriptionListItem>> Handle(GetClinicPrescriptionsQuery r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var page = Math.Max(r.PageNumber, 1);
        var size = Math.Clamp(r.PageSize, 1, 100);
        var q = _db.ClinicPrescriptions.AsNoTracking().Where(p => p.ClinicId == cid);
        if (r.DoctorId.HasValue) q = q.Where(p => p.DoctorId == r.DoctorId.Value);
        if (r.DateFrom.HasValue) q = q.Where(p => p.VisitDate >= r.DateFrom.Value);
        if (r.DateTo.HasValue) q = q.Where(p => p.VisitDate <= r.DateTo.Value);
        if (!string.IsNullOrWhiteSpace(r.Search))
        {
            var like = $"%{ClinicScope.Escape(r.Search)}%";
            q = q.Where(p => EF.Functions.ILike(p.PatientName, like) || EF.Functions.ILike(p.PatientPhone, like)
                          || EF.Functions.ILike(p.RxNo, like) || EF.Functions.ILike(p.Diagnosis ?? "", like));
        }
        var total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(p => p.VisitDate).ThenByDescending(p => p.RxSerial)
            .Skip((page - 1) * size).Take(size)
            .Select(p => new ClinicPrescriptionListItem
            {
                Id = p.Id,
                RxNo = p.RxNo,
                VisitDate = p.VisitDate,
                PatientName = p.PatientName,
                PatientAge = p.PatientAge,
                PatientPhone = p.PatientPhone,
                DoctorName = p.DoctorName,
                Diagnosis = p.Diagnosis,
                MedicineCount = p.Items.Count,
                TestCount = p.Tests.Count
            }).ToListAsync(ct);
        return new PagedResult<ClinicPrescriptionListItem> { Items = items, TotalCount = total, PageNumber = page, PageSize = size };
    }
}

// ------------------------------ delete ------------------------------
public class DeleteClinicPrescriptionCommand : IRequest { public Guid Id { get; set; } }

public class DeleteClinicPrescriptionCommandHandler : IRequestHandler<DeleteClinicPrescriptionCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public DeleteClinicPrescriptionCommandHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task Handle(DeleteClinicPrescriptionCommand r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var rx = await _db.ClinicPrescriptions.FirstOrDefaultAsync(p => p.Id == r.Id && p.ClinicId == cid, ct)
                 ?? throw new NotFoundException("Prescription", r.Id);
        var booking = await _db.ClinicBookings.FirstOrDefaultAsync(b => b.ClinicId == cid && b.PrescriptionId == r.Id, ct);
        if (booking is not null)
        {
            booking.PrescriptionId = null;
            booking.Status = BookingStatus.Booked;   // the visit is open again
            booking.UpdatedAt = DateTimeOffset.UtcNow;
        }
        _db.ClinicPrescriptions.Remove(rx);          // items + tests are removed by the FK cascade
        await _db.SaveChangesAsync(ct);
    }
}