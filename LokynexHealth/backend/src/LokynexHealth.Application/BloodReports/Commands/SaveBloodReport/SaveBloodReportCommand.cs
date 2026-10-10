using FluentValidation;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.BloodReports.Commands.SaveBloodReport;

public class SaveBloodResultInput
{
    public Guid ParameterId { get; set; }
    /// <summary>Empty / null = this parameter is not part of the report.</summary>
    public string? Value { get; set; }
    /// <summary>Only used for non-numeric results (Normal / Low / High / Abnormal).</summary>
    public string? Flag { get; set; }
}

public class SaveBloodReportCommand : IRequest<Guid>
{
    public Guid OrderItemId { get; set; }
    public Guid? CreatedBy { get; set; }   // set by the controller

    public string? SampleId { get; set; }
    public string? Specimen { get; set; }
    public string? Method { get; set; }
    public string? MachineName { get; set; }
    public string? ReagentName { get; set; }
    public string? Remarks { get; set; }
    public DateTimeOffset? SampleCollectedAt { get; set; }
    public DateTimeOffset? ReportedAt { get; set; }
    public bool RememberDefaults { get; set; }
    public bool? UseLetterhead { get; set; }

    // HTML snapshots built by the UI (so the old Print button keeps working)
    public string? HeaderContent { get; set; }
    public string? BodyContent { get; set; }
    public string? FooterContent { get; set; }

    public List<SaveBloodResultInput> Results { get; set; } = new();
}

public class SaveBloodReportCommandValidator : AbstractValidator<SaveBloodReportCommand>
{
    public SaveBloodReportCommandValidator()
    {
        RuleFor(x => x.OrderItemId).NotEmpty();
        RuleFor(x => x.Results).NotNull().Must(r => r.Count <= 300)
            .WithMessage("Too many result rows.");
        RuleForEach(x => x.Results).ChildRules(r =>
        {
            r.RuleFor(i => i.ParameterId).NotEmpty();
            r.RuleFor(i => i.Value).MaximumLength(200);
        });
        RuleFor(x => x.SampleId).MaximumLength(40);
        RuleFor(x => x.Specimen).MaximumLength(120);
        RuleFor(x => x.Method).MaximumLength(200);
        RuleFor(x => x.MachineName).MaximumLength(150);
        RuleFor(x => x.ReagentName).MaximumLength(200);
        RuleFor(x => x.BodyContent).NotEmpty().WithMessage("Report body is missing.");
    }
}

public class SaveBloodReportCommandHandler : IRequestHandler<SaveBloodReportCommand, Guid>
{
    private readonly IApplicationDbContext _db;

    public SaveBloodReportCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    private static string? Clean(string? v) => string.IsNullOrWhiteSpace(v) ? null : v.Trim();

    public async Task<Guid> Handle(SaveBloodReportCommand request, CancellationToken ct)
    {
        var item = await _db.OrderItems
            .Include(i => i.Order).ThenInclude(o => o.Patient)
            .Include(i => i.Order).ThenInclude(o => o.Relative)
            .FirstOrDefaultAsync(i => i.Id == request.OrderItemId, ct)
            ?? throw new NotFoundException(nameof(OrderItem), request.OrderItemId);

        if (item.Order.IsDeleted)
            throw new ConflictException("This order is deleted, so a report cannot be saved.");

        var person = item.Order.Relative;
        int? age = person is not null ? person.Age : item.Order.Patient.Age;
        GenderType? gender = person is not null ? person.Gender : item.Order.Patient.Gender;
        int? ageDays = age is null ? null : age * 365;

        var parameters = await _db.TestParameters
            .Include(p => p.ReferenceRanges)
            .Where(p => p.TestId == item.TestId)
            .ToDictionaryAsync(p => p.Id, ct);

        // A TenantAdmin has no row in `users`; only store a user id that really exists (FK).
        Guid? userId = null;
        if (request.CreatedBy is Guid uid && await _db.Users.AnyAsync(u => u.Id == uid, ct))
            userId = uid;

        var now = DateTimeOffset.UtcNow;

        // ---- find or create the report document ----
        var doc = await _db.ReportDocuments
            .Where(d => d.OrderItemId == item.Id && !d.IsDeleted
                        && d.BodyContent != null
                        && d.BodyContent.StartsWith(BloodReportConstants.StructuredMarker))
            .OrderByDescending(d => d.CreatedAt)
            .FirstOrDefaultAsync(ct);

        var isNew = doc is null;
        if (doc is null)
        {
            doc = new ReportDocument
            {
                Id = Guid.NewGuid(),
                OrderItemId = item.Id,
                SourceType = ReportSourceType.Manual,
                CreatedBy = userId,
                CreatedAt = now
            };
            _db.ReportDocuments.Add(doc);
        }
        else
        {
            doc.UpdatedBy = userId;
            doc.UpdatedAt = now;
        }

        doc.HeaderContent = request.HeaderContent;
        doc.FooterContent = request.FooterContent;
        doc.BodyContent = BloodReportConstants.StructuredMarker + (request.BodyContent ?? string.Empty);
        doc.UseLetterhead = request.UseLetterhead;
        doc.SampleId = Clean(request.SampleId);
        doc.Specimen = Clean(request.Specimen);
        doc.MethodText = Clean(request.Method);
        doc.MachineName = Clean(request.MachineName);
        doc.ReagentName = Clean(request.ReagentName);
        doc.ReportRemarks = Clean(request.Remarks);
        doc.SampleCollectedAt = request.SampleCollectedAt ?? doc.SampleCollectedAt;
        doc.ReportedAt = request.ReportedAt ?? doc.ReportedAt ?? now;
        doc.VerifiedBy = userId ?? doc.VerifiedBy;

        // ---- results (update in place -> no unique-key clash) ----
        var existing = isNew
            ? new List<ReportResult>()
            : await _db.ReportResults.Where(r => r.ReportDocumentId == doc.Id).ToListAsync(ct);
        var existingByParam = existing.ToDictionary(r => r.ParameterId);
        var keep = new HashSet<Guid>();

        foreach (var input in request.Results)
        {
            var value = Clean(input.Value);
            if (value is null) continue;
            if (!parameters.TryGetValue(input.ParameterId, out var p)) continue;

            var picked = BloodReportRules.PickRange(p.ReferenceRanges, gender, ageDays);
            var refText = BloodReportRules.ReferenceText(p.ReferenceRanges, picked);

            decimal? numeric = p.ResultType == "Text" ? null : BloodReportRules.ParseNumber(value);
            string flag;
            if (numeric is not null)
            {
                flag = BloodReportRules.ComputeFlag(
                    numeric, picked?.LowValue, picked?.HighValue, picked?.CriticalLow, picked?.CriticalHigh);
            }
            else
            {
                // non-numeric result: a manual Low/High/Abnormal wins, otherwise decide from the reference text
                flag = input.Flag is "Low" or "High" or "Abnormal"
                    ? input.Flag
                    : BloodReportRules.ComputeTextFlag(value, refText);
            }

            keep.Add(p.Id);

            if (existingByParam.TryGetValue(p.Id, out var row))
            {
                row.SectionName = p.SectionName;
                row.ParameterName = p.Name;
                row.Unit = p.Unit;
                row.ReferenceText = refText;
                row.SortOrder = p.SortOrder;
                row.ResultValue = value;
                row.ResultNumeric = numeric;
                row.Flag = flag;
                row.EnteredBy = userId ?? row.EnteredBy;
                row.UpdatedAt = now;
            }
            else
            {
                _db.ReportResults.Add(new ReportResult
                {
                    Id = Guid.NewGuid(),
                    ReportDocumentId = doc.Id,
                    ParameterId = p.Id,
                    SectionName = p.SectionName,
                    ParameterName = p.Name,
                    Unit = p.Unit,
                    ReferenceText = refText,
                    SortOrder = p.SortOrder,
                    ResultValue = value,
                    ResultNumeric = numeric,
                    Flag = flag,
                    EnteredBy = userId,
                    CreatedAt = now
                });
            }
        }

        var toRemove = existing.Where(r => !keep.Contains(r.ParameterId)).ToList();
        if (toRemove.Count > 0) _db.ReportResults.RemoveRange(toRemove);

        item.ReportStatus = ReportStatusType.Uploaded;

        // ---- remember machine / chemical for next time ----
        if (request.RememberDefaults)
        {
            var info = await _db.TestReportInfos.FirstOrDefaultAsync(x => x.TestId == item.TestId, ct);
            if (info is null)
            {
                info = new TestReportInfo { TestId = item.TestId };
                _db.TestReportInfos.Add(info);
            }
            info.Specimen = doc.Specimen;
            info.Method = doc.MethodText;
            info.MachineName = doc.MachineName;
            info.ReagentName = doc.ReagentName;
            info.UpdatedAt = now;
        }

        await _db.SaveChangesAsync(ct);
        return doc.Id;
    }
}