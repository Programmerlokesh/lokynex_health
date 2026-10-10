using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.BloodReports.Queries.GetBloodReportForm;

public class GetBloodReportFormQuery : IRequest<BloodReportFormDto>
{
    public Guid OrderItemId { get; set; }
}

public class GetBloodReportFormQueryHandler : IRequestHandler<GetBloodReportFormQuery, BloodReportFormDto>
{
    private readonly IApplicationDbContext _db;

    public GetBloodReportFormQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<BloodReportFormDto> Handle(GetBloodReportFormQuery request, CancellationToken ct)
    {
        var item = await _db.OrderItems
            .AsNoTracking()
            .AsSplitQuery()
            .Include(i => i.Test).ThenInclude(t => t.Department)
            .Include(i => i.Order).ThenInclude(o => o.Patient)
            .Include(i => i.Order).ThenInclude(o => o.Relative)
            .Include(i => i.Order).ThenInclude(o => o.Branch)
            .FirstOrDefaultAsync(i => i.Id == request.OrderItemId, ct)
            ?? throw new NotFoundException(nameof(OrderItem), request.OrderItemId);

        var order = item.Order;
        var person = order.Relative;
        int? age = person is not null ? person.Age : order.Patient.Age;
        GenderType? gender = person is not null ? person.Gender : order.Patient.Gender;
        int? ageDays = age is null ? null : age * 365;

        var dto = new BloodReportFormDto
        {
            OrderId = order.Id,
            OrderItemId = item.Id,
            OrderNumber = order.OrderNumber,
            OrderCreatedAt = order.CreatedAt,
            TestName = item.Test.Name,
            DepartmentName = item.Test.Department?.Name ?? string.Empty,
            PatientName = person?.Name ?? order.Patient.FullName,
            PatientCode = order.Patient.PatientCode,
            PatientPhone = order.Patient.Phone,
            WhatsappNumber = order.Patient.WhatsappNumber,
            PatientAge = age,
            PatientGender = gender?.ToString(),
            BranchName = order.Branch?.BranchName,
            BranchAddress = order.Branch?.BranchAddress,
            BranchPhone = order.Branch?.BranchPhone
        };

        // Doctor / referral live in the platform schema (no navigation) — fetch by key.
        if (order.DoctorId.HasValue)
        {
            dto.DoctorName = await _db.Doctors.AsNoTracking()
                .Where(d => d.Id == order.DoctorId.Value)
                .Select(d => d.FullName)
                .FirstOrDefaultAsync(ct);
        }
        if (order.ReferralId.HasValue)
        {
            dto.ReferralName = await _db.Referrals.AsNoTracking()
                .Where(r => r.Id == order.ReferralId.Value)
                .Select(r => r.FullName)
                .FirstOrDefaultAsync(ct);
        }

        // ---- report format (parameters + ranges) ----
        var parameters = await _db.TestParameters
            .AsNoTracking()
            .Include(p => p.ReferenceRanges)
            .Where(p => p.TestId == item.TestId && p.Status == RecordStatus.Active)
            .OrderBy(p => p.SortOrder).ThenBy(p => p.Name)
            .ToListAsync(ct);

        dto.HasFormat = parameters.Count > 0;

        // ---- already saved structured report for this test line? ----
        var doc = await _db.ReportDocuments
            .AsNoTracking()
            .Where(d => d.OrderItemId == item.Id && !d.IsDeleted
                        && d.BodyContent != null
                        && d.BodyContent.StartsWith(BloodReportConstants.StructuredMarker))
            .OrderByDescending(d => d.CreatedAt)
            .FirstOrDefaultAsync(ct);

        var results = new Dictionary<Guid, ReportResult>();
        if (doc is not null)
        {
            results = await _db.ReportResults.AsNoTracking()
                .Where(r => r.ReportDocumentId == doc.Id)
                .ToDictionaryAsync(r => r.ParameterId, ct);
        }

        foreach (var p in parameters)
        {
            var picked = BloodReportRules.PickRange(p.ReferenceRanges, gender, ageDays);
            results.TryGetValue(p.Id, out var saved);

            dto.Parameters.Add(new BloodReportParameterDto
            {
                ParameterId = p.Id,
                SectionName = p.SectionName,
                Name = p.Name,
                Unit = p.Unit,
                ReferenceText = saved?.ReferenceText ?? BloodReportRules.ReferenceText(p.ReferenceRanges, picked),
                Low = picked?.LowValue,
                High = picked?.HighValue,
                CriticalLow = picked?.CriticalLow,
                CriticalHigh = picked?.CriticalHigh,
                ResultType = p.ResultType,
                DecimalPlaces = p.DecimalPlaces,
                IsBold = p.IsBold,
                SortOrder = p.SortOrder,
                ResultValue = saved?.ResultValue,
                Flag = saved?.Flag ?? "Normal"
            });
        }

        // ---- machine / chemical / specimen / method ----
        var info = await _db.TestReportInfos.AsNoTracking()
            .FirstOrDefaultAsync(x => x.TestId == item.TestId, ct);

        if (doc is not null)
        {
            dto.ReportDocumentId = doc.Id;
            dto.SampleId = doc.SampleId;
            dto.Specimen = doc.Specimen;
            dto.Method = doc.MethodText;
            dto.MachineName = doc.MachineName;
            dto.ReagentName = doc.ReagentName;
            dto.Remarks = doc.ReportRemarks;
            dto.SampleCollectedAt = doc.SampleCollectedAt;
            dto.ReportedAt = doc.ReportedAt;
        }
        else if (info is not null)
        {
            dto.Specimen = info.Specimen;
            dto.Method = info.Method;
            dto.MachineName = info.MachineName;
            dto.ReagentName = info.ReagentName;
            dto.Remarks = info.Interpretation;
        }

        // ---- letterhead settings (branch row overrides the lab default) ----
        Guid? branchId = order.Branch?.Id;
        var rows = await _db.LabReportSettings.AsNoTracking()
            .Where(s => s.BranchId == null || s.BranchId == branchId)
            .ToListAsync(ct);
        var s = (branchId is not null ? rows.FirstOrDefault(x => x.BranchId == branchId) : null)
                ?? rows.FirstOrDefault(x => x.BranchId == null);

        if (s is not null)
        {
            dto.Settings = new LabReportSettingDto
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

        return dto;
    }
}