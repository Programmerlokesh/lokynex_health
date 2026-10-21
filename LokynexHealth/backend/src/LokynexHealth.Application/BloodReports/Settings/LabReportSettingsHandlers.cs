using FluentValidation;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.BloodReports.Settings;

// ---------------- GET ----------------
public class GetLabReportSettingsQuery : IRequest<LabReportSettingDto>
{
    /// <summary>NULL = lab default. Otherwise the pad of that department (falls back to the default).</summary>
    public Guid? DepartmentId { get; set; }
}

public class GetLabReportSettingsQueryHandler : IRequestHandler<GetLabReportSettingsQuery, LabReportSettingDto>
{
    private readonly IApplicationDbContext _db;
    public GetLabReportSettingsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<LabReportSettingDto> Handle(GetLabReportSettingsQuery request, CancellationToken ct)
    {
        LabReportSetting? s = null;
        var custom = false;
        if (request.DepartmentId is Guid did)
        {
            s = await _db.LabReportSettings.AsNoTracking()
                .FirstOrDefaultAsync(x => x.BranchId == null && x.DepartmentId == did, ct);
            custom = s is not null;
        }
        s ??= await _db.LabReportSettings.AsNoTracking()
            .FirstOrDefaultAsync(x => x.BranchId == null && x.DepartmentId == null, ct);
        if (s is null) return new LabReportSettingDto { DepartmentId = request.DepartmentId };
        return new LabReportSettingDto
        {
            DepartmentId = request.DepartmentId,
            IsCustom = custom,
            UseLetterhead = s.UseLetterhead,
            HeaderHtml = s.HeaderHtml,
            FooterHtml = s.FooterHtml,
            HeaderSpaceMm = s.HeaderSpaceMm,
            FooterSpaceMm = s.FooterSpaceMm,
            PathologistName = s.PathologistName,
            PathologistQualification = s.PathologistQualification,
            RegistrationNo = s.RegistrationNo,
            SignatureImage = s.SignatureImage
        };
    }
}

// ---------------- LIST departments that have their own pad ----------------
public class GetCustomPadDepartmentsQuery : IRequest<List<Guid>> { }

public class GetCustomPadDepartmentsQueryHandler : IRequestHandler<GetCustomPadDepartmentsQuery, List<Guid>>
{
    private readonly IApplicationDbContext _db;
    public GetCustomPadDepartmentsQueryHandler(IApplicationDbContext db) => _db = db;

    public Task<List<Guid>> Handle(GetCustomPadDepartmentsQuery request, CancellationToken ct) =>
        _db.LabReportSettings.AsNoTracking()
            .Where(x => x.BranchId == null && x.DepartmentId != null)
            .Select(x => x.DepartmentId!.Value)
            .ToListAsync(ct);
}

// ---------------- DELETE (department goes back to the lab default pad) ----------------
public class DeleteDepartmentPadCommand : IRequest
{
    public Guid DepartmentId { get; set; }
}

public class DeleteDepartmentPadCommandHandler : IRequestHandler<DeleteDepartmentPadCommand>
{
    private readonly IApplicationDbContext _db;
    public DeleteDepartmentPadCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task Handle(DeleteDepartmentPadCommand request, CancellationToken ct)
    {
        var s = await _db.LabReportSettings
            .FirstOrDefaultAsync(x => x.BranchId == null && x.DepartmentId == request.DepartmentId, ct);
        if (s is null) return;
        _db.LabReportSettings.Remove(s);
        await _db.SaveChangesAsync(ct);
    }
}

// ---------------- PUT ----------------
public class SaveLabReportSettingsCommand : IRequest
{
    public Guid? UpdatedBy { get; set; }

    /// <summary>NULL = lab default pad, otherwise the pad of one department.</summary>
    public Guid? DepartmentId { get; set; }
    public bool UseLetterhead { get; set; }
    public string? HeaderHtml { get; set; }
    public string? FooterHtml { get; set; }
    public int HeaderSpaceMm { get; set; }
    public int FooterSpaceMm { get; set; }
    public string? PathologistName { get; set; }
    public string? PathologistQualification { get; set; }
    public string? RegistrationNo { get; set; }
    public string? SignatureImage { get; set; }
}

public class SaveLabReportSettingsCommandValidator : AbstractValidator<SaveLabReportSettingsCommand>
{
    public SaveLabReportSettingsCommandValidator()
    {
        RuleFor(x => x.HeaderSpaceMm).InclusiveBetween(0, 100);
        RuleFor(x => x.FooterSpaceMm).InclusiveBetween(0, 100);
        RuleFor(x => x.HeaderHtml).MaximumLength(3_000_000);
        RuleFor(x => x.FooterHtml).MaximumLength(3_000_000);
        RuleFor(x => x.SignatureImage).MaximumLength(1_500_000);
        RuleFor(x => x.PathologistName).MaximumLength(150);
        RuleFor(x => x.PathologistQualification).MaximumLength(200);
        RuleFor(x => x.RegistrationNo).MaximumLength(60);
    }
}

public class SaveLabReportSettingsCommandHandler : IRequestHandler<SaveLabReportSettingsCommand>
{
    private readonly IApplicationDbContext _db;
    public SaveLabReportSettingsCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task Handle(SaveLabReportSettingsCommand request, CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;
        var s = await _db.LabReportSettings
            .FirstOrDefaultAsync(x => x.BranchId == null && x.DepartmentId == request.DepartmentId, ct);
        if (s is null)
        {
            s = new LabReportSetting
            {
                Id = Guid.NewGuid(),
                BranchId = null,
                DepartmentId = request.DepartmentId,
                CreatedAt = now
            };
            _db.LabReportSettings.Add(s);
        }
        else
        {
            s.UpdatedAt = now;
        }

        Guid? userId = null;
        if (request.UpdatedBy is Guid uid && await _db.Users.AnyAsync(u => u.Id == uid, ct))
            userId = uid;

        s.UseLetterhead = request.UseLetterhead;
        s.HeaderHtml = request.HeaderHtml;
        s.FooterHtml = request.FooterHtml;
        s.HeaderSpaceMm = (short)request.HeaderSpaceMm;
        s.FooterSpaceMm = (short)request.FooterSpaceMm;
        s.PathologistName = request.PathologistName;
        s.PathologistQualification = request.PathologistQualification;
        s.RegistrationNo = request.RegistrationNo;
        s.SignatureImage = request.SignatureImage;
        s.UpdatedBy = userId;

        await _db.SaveChangesAsync(ct);
    }
}