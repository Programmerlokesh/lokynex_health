using FluentValidation;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.BloodReports.Settings;

// ---------------- GET ----------------
public class GetLabReportSettingsQuery : IRequest<LabReportSettingDto> { }

public class GetLabReportSettingsQueryHandler : IRequestHandler<GetLabReportSettingsQuery, LabReportSettingDto>
{
    private readonly IApplicationDbContext _db;
    public GetLabReportSettingsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<LabReportSettingDto> Handle(GetLabReportSettingsQuery request, CancellationToken ct)
    {
        var s = await _db.LabReportSettings.AsNoTracking().FirstOrDefaultAsync(x => x.BranchId == null, ct);
        if (s is null) return new LabReportSettingDto();
        return new LabReportSettingDto
        {
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

// ---------------- PUT ----------------
public class SaveLabReportSettingsCommand : IRequest
{
    public Guid? UpdatedBy { get; set; }
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
        var s = await _db.LabReportSettings.FirstOrDefaultAsync(x => x.BranchId == null, ct);
        if (s is null)
        {
            s = new LabReportSetting { Id = Guid.NewGuid(), BranchId = null, CreatedAt = now };
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