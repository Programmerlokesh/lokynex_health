using FluentValidation;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Common.Models;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Clinics;

// =====================================================================
//  PATIENTS
// =====================================================================
public class ClinicPatientDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public int? Age { get; set; }
    public string? Gender { get; set; }
    public string Phone { get; set; } = default!;
    public string? WhatsappNumber { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? Pincode { get; set; }
    public DateTimeOffset? LastVisitAt { get; set; }
    public int VisitCount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>Who last edited the details by hand, and when (NULL = never edited).</summary>
    public string? EditedByUsername { get; set; }
    public DateTimeOffset? EditedAt { get; set; }
}

public class SearchClinicPatientsQuery : IRequest<PagedResult<ClinicPatientDto>>
{
    public string? Search { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class SearchClinicPatientsQueryHandler : IRequestHandler<SearchClinicPatientsQuery, PagedResult<ClinicPatientDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public SearchClinicPatientsQueryHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task<PagedResult<ClinicPatientDto>> Handle(SearchClinicPatientsQuery r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var page = Math.Max(r.PageNumber, 1);
        var size = Math.Clamp(r.PageSize, 1, 100);
        var q = _db.ClinicPatients.AsNoTracking().Where(p => p.ClinicId == cid);

        if (!string.IsNullOrWhiteSpace(r.Search))
        {
            var term = r.Search.Trim();
            var digits = new string(term.Where(char.IsDigit).ToArray());
            // A mostly-numeric search means "phone"; anything else searches the name.
            if (digits.Length >= 4 && digits.Length >= term.Length - 2)
            {
                var like = $"%{digits}%";
                q = q.Where(p => EF.Functions.ILike(p.Phone, like));
            }
            else
            {
                var like = $"%{ClinicScope.Escape(term)}%";
                q = q.Where(p => EF.Functions.ILike(p.Name, like));
            }
        }

        var total = await q.CountAsync(ct);
        var rows = await q.OrderByDescending(p => p.LastVisitAt).ThenBy(p => p.Name)
            .Skip((page - 1) * size).Take(size).ToListAsync(ct);

        var ids = rows.Select(p => p.Id).ToList();
        var visits = await _db.ClinicPrescriptions.AsNoTracking()
            .Where(x => x.PatientId != null && ids.Contains(x.PatientId.Value))
            .GroupBy(x => x.PatientId!.Value).Select(g => new { g.Key, N = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.N, ct);

        return new PagedResult<ClinicPatientDto>
        {
            Items = rows.Select(p => new ClinicPatientDto
            {
                Id = p.Id,
                Name = p.Name,
                Age = p.Age,
                Gender = p.Gender,
                Phone = p.Phone,
                WhatsappNumber = p.WhatsappNumber,
                Email = p.Email,
                Address = p.Address,
                Pincode = p.Pincode,
                LastVisitAt = p.LastVisitAt,
                VisitCount = visits.GetValueOrDefault(p.Id),
                CreatedAt = p.CreatedAt,
                EditedByUsername = p.EditedByUsername,
                EditedAt = p.EditedAt
            }).ToList(),
            TotalCount = total,
            PageNumber = page,
            PageSize = size
        };
    }
}

public class ClinicPatientHistoryDto
{
    public ClinicPatientDto Patient { get; set; } = default!;
    public List<ClinicPrescriptionListItem> Prescriptions { get; set; } = new();
}

public class GetClinicPatientHistoryQuery : IRequest<ClinicPatientHistoryDto> { public Guid Id { get; set; } }

public class GetClinicPatientHistoryQueryHandler : IRequestHandler<GetClinicPatientHistoryQuery, ClinicPatientHistoryDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public GetClinicPatientHistoryQueryHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task<ClinicPatientHistoryDto> Handle(GetClinicPatientHistoryQuery r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var p = await _db.ClinicPatients.AsNoTracking().FirstOrDefaultAsync(x => x.Id == r.Id && x.ClinicId == cid, ct)
                ?? throw new NotFoundException("Patient", r.Id);
        var list = await _db.ClinicPrescriptions.AsNoTracking()
            .Where(x => x.ClinicId == cid && x.PatientId == r.Id)
            .OrderByDescending(x => x.VisitDate).ThenByDescending(x => x.RxSerial)
            .Select(x => new ClinicPrescriptionListItem
            {
                Id = x.Id,
                RxNo = x.RxNo,
                VisitDate = x.VisitDate,
                PatientName = x.PatientName,
                PatientAge = x.PatientAge,
                PatientPhone = x.PatientPhone,
                DoctorName = x.DoctorName,
                Diagnosis = x.Diagnosis,
                MedicineCount = x.Items.Count,
                TestCount = x.Tests.Count
            }).ToListAsync(ct);
        return new ClinicPatientHistoryDto
        {
            Patient = new ClinicPatientDto
            {
                Id = p.Id,
                Name = p.Name,
                Age = p.Age,
                Gender = p.Gender,
                Phone = p.Phone,
                WhatsappNumber = p.WhatsappNumber,
                Email = p.Email,
                Address = p.Address,
                Pincode = p.Pincode,
                LastVisitAt = p.LastVisitAt,
                VisitCount = list.Count,
                CreatedAt = p.CreatedAt,
                EditedByUsername = p.EditedByUsername,
                EditedAt = p.EditedAt
            },
            Prescriptions = list
        };
    }
}

// ---------- edit a patient by hand (records who + when) ----------
public class UpdateClinicPatientCommand : IRequest<ClinicPatientDto>
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public int? Age { get; set; }
    public string? Gender { get; set; }
    public string Phone { get; set; } = default!;
    public string? WhatsappNumber { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? Pincode { get; set; }
}

public class UpdateClinicPatientCommandValidator : AbstractValidator<UpdateClinicPatientCommand>
{
    public UpdateClinicPatientCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Age).InclusiveBetween(0, 150).When(x => x.Age.HasValue);
        RuleFor(x => x.Gender).MaximumLength(10);
        RuleFor(x => x.Phone).RequiredMobile();
        RuleFor(x => x.WhatsappNumber).OptionalMobile();
        RuleFor(x => x.Email).MaximumLength(150);
        RuleFor(x => x.Pincode).MaximumLength(10);
    }
}

public class UpdateClinicPatientCommandHandler : IRequestHandler<UpdateClinicPatientCommand, ClinicPatientDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public UpdateClinicPatientCommandHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task<ClinicPatientDto> Handle(UpdateClinicPatientCommand r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var p = await _db.ClinicPatients.FirstOrDefaultAsync(x => x.Id == r.Id && x.ClinicId == cid, ct)
                ?? throw new NotFoundException("Patient", r.Id);

        var phone = ClinicRules.Mobile(r.Phone)!;
        var now = DateTimeOffset.UtcNow;

        p.Name = r.Name.Trim();
        p.Age = r.Age;
        p.Gender = ClinicScope.Clean(r.Gender);
        p.Phone = phone;
        p.WhatsappNumber = ClinicRules.Mobile(r.WhatsappNumber) ?? phone;
        p.Email = ClinicScope.Clean(r.Email);
        p.Address = ClinicScope.Clean(r.Address);
        p.Pincode = ClinicScope.Clean(r.Pincode);
        p.UpdatedAt = now;
        p.EditedAt = now;
        p.EditedByUsername = _user.Username;

        await _db.SaveChangesAsync(ct);

        var visits = await _db.ClinicPrescriptions.AsNoTracking()
            .CountAsync(x => x.ClinicId == cid && x.PatientId == p.Id, ct);
        return new ClinicPatientDto
        {
            Id = p.Id,
            Name = p.Name,
            Age = p.Age,
            Gender = p.Gender,
            Phone = p.Phone,
            WhatsappNumber = p.WhatsappNumber,
            Email = p.Email,
            Address = p.Address,
            Pincode = p.Pincode,
            LastVisitAt = p.LastVisitAt,
            VisitCount = visits,
            CreatedAt = p.CreatedAt,
            EditedByUsername = p.EditedByUsername,
            EditedAt = p.EditedAt
        };
    }
}

// =====================================================================
//  LAB TEST CATALOG (read-only) — for "Advise tests" on a prescription
//  The clinic reads the SAME departments and tests the lab module uses.
// =====================================================================
public class ClinicTestDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public Guid DepartmentId { get; set; }
    public string DepartmentName { get; set; } = default!;
}

public class ClinicTestDepartmentDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public int TestCount { get; set; }
}

public class SearchClinicTestsQuery : IRequest<List<ClinicTestDto>>
{
    public string? Q { get; set; }
    public Guid? DepartmentId { get; set; }
    public int Take { get; set; } = 20;
}

public class SearchClinicTestsQueryHandler : IRequestHandler<SearchClinicTestsQuery, List<ClinicTestDto>>
{
    private readonly IApplicationDbContext _db;
    public SearchClinicTestsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<List<ClinicTestDto>> Handle(SearchClinicTestsQuery r, CancellationToken ct)
    {
        var take = Math.Clamp(r.Take, 1, 50);
        var q = _db.Tests.AsNoTracking().Where(t => t.Status == RecordStatus.Active && t.Department.Status == RecordStatus.Active);
        if (r.DepartmentId.HasValue) q = q.Where(t => t.DepartmentId == r.DepartmentId.Value);

        if (!string.IsNullOrWhiteSpace(r.Q))
        {
            var esc = ClinicScope.Escape(r.Q);
            var contains = $"%{esc}%";
            var prefix = $"{esc}%";
            q = q.Where(t => EF.Functions.ILike(t.Name, contains));
            // names that START with the typed text come first, then the rest alphabetically
            return await q.OrderByDescending(t => EF.Functions.ILike(t.Name, prefix)).ThenBy(t => t.Name).Take(take)
                .Select(t => new ClinicTestDto { Id = t.Id, Name = t.Name, DepartmentId = t.DepartmentId, DepartmentName = t.Department.Name })
                .ToListAsync(ct);
        }
        return await q.OrderBy(t => t.Name).Take(take)
            .Select(t => new ClinicTestDto { Id = t.Id, Name = t.Name, DepartmentId = t.DepartmentId, DepartmentName = t.Department.Name })
            .ToListAsync(ct);
    }
}

public class GetClinicTestDepartmentsQuery : IRequest<List<ClinicTestDepartmentDto>> { }

public class GetClinicTestDepartmentsQueryHandler : IRequestHandler<GetClinicTestDepartmentsQuery, List<ClinicTestDepartmentDto>>
{
    private readonly IApplicationDbContext _db;
    public GetClinicTestDepartmentsQueryHandler(IApplicationDbContext db) => _db = db;

    public Task<List<ClinicTestDepartmentDto>> Handle(GetClinicTestDepartmentsQuery r, CancellationToken ct) =>
        _db.Departments.AsNoTracking().Where(d => d.Status == RecordStatus.Active)
            .Select(d => new ClinicTestDepartmentDto
            {
                Id = d.Id,
                Name = d.Name,
                TestCount = d.Tests.Count(t => t.Status == RecordStatus.Active)
            })
            .Where(d => d.TestCount > 0).OrderBy(d => d.Name).ToListAsync(ct);
}

// =====================================================================
//  MEDICINES (the clinic's own formulary)
// =====================================================================
public class ClinicMedicineDto
{
    public Guid Id { get; set; }
    public string BrandName { get; set; } = default!;
    public string Company { get; set; } = default!;
    public string? Composition { get; set; }
    public string? Form { get; set; }
    public string? DefaultDosage { get; set; }
    public string? DefaultDuration { get; set; }
    public string? DefaultInstructions { get; set; }
    public string Source { get; set; } = default!;
    public int UsageCount { get; set; }
    public bool IsActive { get; set; }
}

internal static class MedicineMap
{
    public static ClinicMedicineDto ToDto(ClinicMedicine m) => new()
    {
        Id = m.Id,
        BrandName = m.BrandName,
        Company = m.Company,
        Composition = m.Composition,
        Form = m.Form,
        DefaultDosage = m.DefaultDosage,
        DefaultDuration = m.DefaultDuration,
        DefaultInstructions = m.DefaultInstructions,
        Source = m.Source,
        UsageCount = m.UsageCount,
        IsActive = m.IsActive
    };
}

/// <summary>Autocomplete for the prescription: type a name, and/or pick a company first.</summary>
public class SearchClinicMedicinesQuery : IRequest<List<ClinicMedicineDto>>
{
    public string? Q { get; set; }
    public string? Company { get; set; }
    public int Take { get; set; } = 15;
}

public class SearchClinicMedicinesQueryHandler : IRequestHandler<SearchClinicMedicinesQuery, List<ClinicMedicineDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public SearchClinicMedicinesQueryHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task<List<ClinicMedicineDto>> Handle(SearchClinicMedicinesQuery r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var take = Math.Clamp(r.Take, 1, 50);
        var q = _db.ClinicMedicines.AsNoTracking().Where(m => m.ClinicId == cid && m.IsActive);

        if (!string.IsNullOrWhiteSpace(r.Company))
        {
            var c = $"%{ClinicScope.Escape(r.Company)}%";
            q = q.Where(m => EF.Functions.ILike(m.Company, c));
        }

        if (!string.IsNullOrWhiteSpace(r.Q))
        {
            var esc = ClinicScope.Escape(r.Q);
            var contains = $"%{esc}%";
            var prefix = $"{esc}%";
            q = q.Where(m => EF.Functions.ILike(m.BrandName, contains) || EF.Functions.ILike(m.Composition ?? "", contains));
            var rows = await q.OrderByDescending(m => EF.Functions.ILike(m.BrandName, prefix))
                .ThenByDescending(m => m.UsageCount).ThenBy(m => m.BrandName).Take(take).ToListAsync(ct);
            return rows.Select(MedicineMap.ToDto).ToList();
        }

        var list = await q.OrderByDescending(m => m.UsageCount).ThenBy(m => m.BrandName).Take(take).ToListAsync(ct);
        return list.Select(MedicineMap.ToDto).ToList();
    }
}

public class ClinicCompanyDto
{
    public string Company { get; set; } = default!;
    public int Count { get; set; }
}

public class GetClinicMedicineCompaniesQuery : IRequest<List<ClinicCompanyDto>>
{
    public string? Q { get; set; }
    public int Take { get; set; } = 15;
}

public class GetClinicMedicineCompaniesQueryHandler : IRequestHandler<GetClinicMedicineCompaniesQuery, List<ClinicCompanyDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public GetClinicMedicineCompaniesQueryHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task<List<ClinicCompanyDto>> Handle(GetClinicMedicineCompaniesQuery r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var q = _db.ClinicMedicines.AsNoTracking().Where(m => m.ClinicId == cid && m.IsActive && m.Company != "");
        if (!string.IsNullOrWhiteSpace(r.Q))
        {
            var like = $"%{ClinicScope.Escape(r.Q)}%";
            q = q.Where(m => EF.Functions.ILike(m.Company, like));
        }
        return await q.GroupBy(m => m.Company).Select(g => new ClinicCompanyDto { Company = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count).ThenBy(x => x.Company).Take(Math.Clamp(r.Take, 1, 50)).ToListAsync(ct);
    }
}

public class GetClinicMedicinesQuery : IRequest<PagedResult<ClinicMedicineDto>>
{
    public string? Search { get; set; }
    public string? Company { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 25;
}

public class GetClinicMedicinesQueryHandler : IRequestHandler<GetClinicMedicinesQuery, PagedResult<ClinicMedicineDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public GetClinicMedicinesQueryHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task<PagedResult<ClinicMedicineDto>> Handle(GetClinicMedicinesQuery r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var page = Math.Max(r.PageNumber, 1);
        var size = Math.Clamp(r.PageSize, 1, 100);
        var q = _db.ClinicMedicines.AsNoTracking().Where(m => m.ClinicId == cid);
        if (!string.IsNullOrWhiteSpace(r.Company))
        {
            var c = $"%{ClinicScope.Escape(r.Company)}%";
            q = q.Where(m => EF.Functions.ILike(m.Company, c));
        }
        if (!string.IsNullOrWhiteSpace(r.Search))
        {
            var like = $"%{ClinicScope.Escape(r.Search)}%";
            q = q.Where(m => EF.Functions.ILike(m.BrandName, like) || EF.Functions.ILike(m.Composition ?? "", like));
        }
        var total = await q.CountAsync(ct);
        var rows = await q.OrderBy(m => m.BrandName).ThenBy(m => m.Company).Skip((page - 1) * size).Take(size).ToListAsync(ct);
        return new PagedResult<ClinicMedicineDto>
        {
            Items = rows.Select(MedicineMap.ToDto).ToList(),
            TotalCount = total,
            PageNumber = page,
            PageSize = size
        };
    }
}

public class SaveClinicMedicineCommand : IRequest<Guid>
{
    /// <summary>Null = create.</summary>
    public Guid? Id { get; set; }
    public string BrandName { get; set; } = default!;
    public string? Company { get; set; }
    public string? Composition { get; set; }
    public string? Form { get; set; }
    public string? DefaultDosage { get; set; }
    public string? DefaultDuration { get; set; }
    public string? DefaultInstructions { get; set; }
    public bool IsActive { get; set; } = true;
}

public class SaveClinicMedicineCommandValidator : AbstractValidator<SaveClinicMedicineCommand>
{
    public SaveClinicMedicineCommandValidator()
    {
        RuleFor(x => x.BrandName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Company).MaximumLength(150);
        RuleFor(x => x.Composition).MaximumLength(500);
        RuleFor(x => x.Form).MaximumLength(40);
        RuleFor(x => x.DefaultDosage).MaximumLength(80);
        RuleFor(x => x.DefaultDuration).MaximumLength(80);
        RuleFor(x => x.DefaultInstructions).MaximumLength(200);
    }
}

public class SaveClinicMedicineCommandHandler : IRequestHandler<SaveClinicMedicineCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public SaveClinicMedicineCommandHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task<Guid> Handle(SaveClinicMedicineCommand r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var name = r.BrandName.Trim();
        var company = (r.Company ?? "").Trim();
        var nameLower = name.ToLower();
        var companyLower = company.ToLower();

        var dupe = await _db.ClinicMedicines.AnyAsync(m => m.ClinicId == cid && m.BrandName.ToLower() == nameLower
            && m.Company.ToLower() == companyLower && (r.Id == null || m.Id != r.Id), ct);
        if (dupe) throw new ConflictException("This medicine already exists for this company.");

        ClinicMedicine m;
        if (r.Id is { } id)
        {
            m = await _db.ClinicMedicines.FirstOrDefaultAsync(x => x.Id == id && x.ClinicId == cid, ct)
                ?? throw new NotFoundException("Medicine", id);
            m.UpdatedAt = DateTimeOffset.UtcNow;
        }
        else
        {
            m = new ClinicMedicine { Id = Guid.NewGuid(), ClinicId = cid, Source = "Manual", CreatedAt = DateTimeOffset.UtcNow };
            _db.ClinicMedicines.Add(m);
        }
        m.BrandName = name;
        m.Company = company;
        m.Composition = ClinicScope.Clean(r.Composition);
        m.Form = ClinicScope.Clean(r.Form);
        m.DefaultDosage = ClinicScope.Clean(r.DefaultDosage);
        m.DefaultDuration = ClinicScope.Clean(r.DefaultDuration);
        m.DefaultInstructions = ClinicScope.Clean(r.DefaultInstructions);
        m.IsActive = r.IsActive;
        await _db.SaveChangesAsync(ct);
        return m.Id;
    }
}

public class DeleteClinicMedicineCommand : IRequest { public Guid Id { get; set; } }

public class DeleteClinicMedicineCommandHandler : IRequestHandler<DeleteClinicMedicineCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public DeleteClinicMedicineCommandHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    public async Task Handle(DeleteClinicMedicineCommand r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);
        var m = await _db.ClinicMedicines.FirstOrDefaultAsync(x => x.Id == r.Id && x.ClinicId == cid, ct)
                ?? throw new NotFoundException("Medicine", r.Id);
        _db.ClinicMedicines.Remove(m);   // old prescriptions keep their own copy of the text
        await _db.SaveChangesAsync(ct);
    }
}

public class ImportMedicineRow
{
    public string BrandName { get; set; } = default!;
    public string? Company { get; set; }
    public string? Composition { get; set; }
    public string? Form { get; set; }
}

public class ImportClinicMedicinesCommand : IRequest<ImportClinicMedicinesResult>
{
    public List<ImportMedicineRow> Rows { get; set; } = new();
}

public class ImportClinicMedicinesResult
{
    public int Added { get; set; }
    public int Skipped { get; set; }
}

public class ImportClinicMedicinesCommandValidator : AbstractValidator<ImportClinicMedicinesCommand>
{
    public ImportClinicMedicinesCommandValidator()
    {
        RuleFor(x => x.Rows).NotEmpty().Must(l => l.Count <= 2000).WithMessage("Send at most 2000 rows per request.");
    }
}

public class ImportClinicMedicinesCommandHandler : IRequestHandler<ImportClinicMedicinesCommand, ImportClinicMedicinesResult>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public ImportClinicMedicinesCommandHandler(IApplicationDbContext db, ICurrentUserService user) { _db = db; _user = user; }

    private static string Key(string name, string company) => $"{name.ToLowerInvariant()}|{company.ToLowerInvariant()}";

    public async Task<ImportClinicMedicinesResult> Handle(ImportClinicMedicinesCommand r, CancellationToken ct)
    {
        var cid = ClinicScope.Id(_user);

        // Clean rows and drop duplicates INSIDE the file with a HashSet (O(n)).
        var seen = new HashSet<string>();
        var clean = new List<(string Name, string Company, string? Comp, string? Form)>();
        var skipped = 0;
        foreach (var row in r.Rows)
        {
            var name = (row.BrandName ?? "").Trim();
            if (name.Length == 0) { skipped++; continue; }
            if (name.Length > 200) name = name[..200];
            var company = (row.Company ?? "").Trim();
            if (company.Length > 150) company = company[..150];
            var comp = ClinicScope.Clean(row.Composition);
            if (comp is { Length: > 500 }) comp = comp[..500];
            var form = ClinicScope.Clean(row.Form);
            if (form is { Length: > 40 }) form = form[..40];
            if (!seen.Add(Key(name, company))) { skipped++; continue; }
            clean.Add((name, company, comp, form));
        }

        // ONE query for the names that might already exist, then O(1) HashSet checks.
        var lowerNames = clean.Select(c => c.Name.ToLowerInvariant()).Distinct().ToList();
        var existing = new HashSet<string>();
        if (lowerNames.Count > 0)
        {
            var found = await _db.ClinicMedicines.AsNoTracking()
                .Where(m => m.ClinicId == cid && lowerNames.Contains(m.BrandName.ToLower()))
                .Select(m => new { m.BrandName, m.Company }).ToListAsync(ct);
            foreach (var f in found) existing.Add(Key(f.BrandName, f.Company));
        }

        var now = DateTimeOffset.UtcNow;
        var added = 0;
        foreach (var c in clean)
        {
            if (existing.Contains(Key(c.Name, c.Company))) { skipped++; continue; }
            _db.ClinicMedicines.Add(new ClinicMedicine
            {
                Id = Guid.NewGuid(),
                ClinicId = cid,
                BrandName = c.Name,
                Company = c.Company,
                Composition = c.Comp,
                Form = c.Form,
                Source = "Import",
                CreatedAt = now
            });
            added++;
        }
        await _db.SaveChangesAsync(ct);
        return new ImportClinicMedicinesResult { Added = added, Skipped = skipped };
    }
}