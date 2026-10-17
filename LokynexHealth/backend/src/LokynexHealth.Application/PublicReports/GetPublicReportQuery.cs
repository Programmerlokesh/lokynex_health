using System.Text.RegularExpressions;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.PublicReports;

public class PublicReportResultDto
{
    public string Section { get; set; } = string.Empty;
    public string Name { get; set; } = default!;
    public string Value { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public string Flag { get; set; } = "Normal";
}

/// What the patient sees after scanning the QR code.
/// No phone number, no commission / payment data.
public class PublicReportDto
{
    public string OrderNumber { get; set; } = default!;
    public string TestName { get; set; } = default!;
    public string DepartmentName { get; set; } = string.Empty;

    public string PatientName { get; set; } = default!;
    public string? PatientCode { get; set; }
    public int? PatientAge { get; set; }
    public string? PatientGender { get; set; }
    public string? ReferredBy { get; set; }

    public string? BranchName { get; set; }
    public string? BranchAddress { get; set; }
    public string? BranchPhone { get; set; }

    public string? SampleId { get; set; }
    public string? Specimen { get; set; }
    public string? Method { get; set; }
    public string? MachineName { get; set; }
    public string? ReagentName { get; set; }
    public string? Remarks { get; set; }
    public DateTimeOffset? SampleCollectedAt { get; set; }
    public DateTimeOffset? ReportedAt { get; set; }

    public string? PathologistName { get; set; }
    public string? PathologistQualification { get; set; }
    public string? RegistrationNo { get; set; }
    public string? SignatureImage { get; set; }

    public List<PublicReportResultDto> Results { get; set; } = new();
}

public class GetPublicReportQuery : IRequest<PublicReportDto>
{
    public string Token { get; set; } = string.Empty;
}

public class GetPublicReportQueryHandler : IRequestHandler<GetPublicReportQuery, PublicReportDto>
{
    private static readonly Regex TokenRx = new("^[a-f0-9]{32}$", RegexOptions.Compiled);

    private readonly IApplicationDbContext _db;

    public GetPublicReportQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PublicReportDto> Handle(GetPublicReportQuery request, CancellationToken ct)
    {
        var token = (request.Token ?? string.Empty).Trim().ToLowerInvariant();
        if (!TokenRx.IsMatch(token))
            throw new NotFoundException("Report", "link");

        var doc = await _db.ReportDocuments
            .AsNoTracking()
            .AsSplitQuery()
            .Include(d => d.OrderItem).ThenInclude(i => i.Test).ThenInclude(t => t.Department)
            .Include(d => d.OrderItem).ThenInclude(i => i.Order).ThenInclude(o => o.Patient)
            .Include(d => d.OrderItem).ThenInclude(i => i.Order).ThenInclude(o => o.Relative)
            .Include(d => d.OrderItem).ThenInclude(i => i.Order).ThenInclude(o => o.Branch)
            .FirstOrDefaultAsync(d => d.PublicToken == token && !d.IsDeleted, ct)
            ?? throw new NotFoundException("Report", "link");

        var item = doc.OrderItem;
        var order = item.Order;
        var person = order.Relative;

        var dto = new PublicReportDto
        {
            OrderNumber = order.OrderNumber,
            TestName = item.Test.Name,
            DepartmentName = item.Test.Department?.Name ?? string.Empty,
            PatientName = person?.Name ?? order.Patient.FullName,
            PatientCode = order.Patient.PatientCode,
            PatientAge = person is not null ? person.Age : order.Patient.Age,
            PatientGender = (person is not null ? person.Gender : order.Patient.Gender)?.ToString(),
            BranchName = order.Branch?.BranchName,
            BranchAddress = order.Branch?.BranchAddress,
            BranchPhone = order.Branch?.BranchPhone,
            SampleId = doc.SampleId,
            Specimen = doc.Specimen,
            Method = doc.MethodText,
            MachineName = doc.MachineName,
            ReagentName = doc.ReagentName,
            Remarks = doc.ReportRemarks,
            SampleCollectedAt = doc.SampleCollectedAt,
            ReportedAt = doc.ReportedAt
        };

        if (order.DoctorId.HasValue)
        {
            dto.ReferredBy = await _db.Doctors.AsNoTracking()
                .Where(d => d.Id == order.DoctorId.Value)
                .Select(d => d.FullName)
                .FirstOrDefaultAsync(ct);
        }
        if (dto.ReferredBy is null && order.ReferralId.HasValue)
        {
            dto.ReferredBy = await _db.Referrals.AsNoTracking()
                .Where(r => r.Id == order.ReferralId.Value)
                .Select(r => r.FullName)
                .FirstOrDefaultAsync(ct);
        }

        dto.Results = await _db.ReportResults.AsNoTracking()
            .Where(r => r.ReportDocumentId == doc.Id)
            .OrderBy(r => r.SortOrder).ThenBy(r => r.ParameterName)
            .Select(r => new PublicReportResultDto
            {
                Section = r.SectionName,
                Name = r.ParameterName,
                Value = r.ResultValue ?? string.Empty,
                Unit = r.Unit ?? string.Empty,
                Reference = r.ReferenceText ?? string.Empty,
                Flag = r.Flag
            })
            .ToListAsync(ct);

        Guid? branchId = order.Branch?.Id;
        var rows = await _db.LabReportSettings.AsNoTracking()
            .Where(s => s.BranchId == null || s.BranchId == branchId)
            .ToListAsync(ct);
        var settings = (branchId is not null ? rows.FirstOrDefault(x => x.BranchId == branchId) : null)
                       ?? rows.FirstOrDefault(x => x.BranchId == null);
        if (settings is not null)
        {
            dto.PathologistName = settings.PathologistName;
            dto.PathologistQualification = settings.PathologistQualification;
            dto.RegistrationNo = settings.RegistrationNo;
            dto.SignatureImage = settings.SignatureImage;
        }

        return dto;
    }
}