using System.Text.RegularExpressions;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.ReportDocuments.Commands.GenerateReportDocument;

public class GenerateReportDocumentCommandHandler : IRequestHandler<GenerateReportDocumentCommand, Guid>
{
    private readonly IApplicationDbContext _db;

    // Compiled once, reused across every call — avoids re-parsing the regex pattern
    // on every single report generation (regex compilation itself is non-trivial cost).
    private static readonly Regex PlaceholderPattern = new(@"\{\{(\w+)\}\}", RegexOptions.Compiled);

    public GenerateReportDocumentCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Guid> Handle(GenerateReportDocumentCommand request, CancellationToken cancellationToken)
    {
        // ---------- 1. Load everything needed in as few round-trips as possible ----------
        var orderItem = await _db.OrderItems
            .Include(i => i.Test)
            .Include(i => i.Order)
                .ThenInclude(o => o.Patient)
            .Include(i => i.Order)
                .ThenInclude(o => o.Relative)
            .FirstOrDefaultAsync(i => i.Id == request.OrderItemId, cancellationToken);

        if (orderItem is null)
            throw new NotFoundException(nameof(OrderItem), request.OrderItemId);

        var template = await _db.ReportTemplates
            .FirstOrDefaultAsync(t => t.Id == request.TemplateId && !t.IsDeleted, cancellationToken);

        if (template is null)
            throw new NotFoundException(nameof(ReportTemplate), request.TemplateId);

        // ---------- 2. Build the merge-field Dictionary — O(1) lookup per placeholder ----------
        // This is the key structure: instead of a long if/else chain checking
        // "is this placeholder patient_name? is it test_name? is it price?",
        // we build ONE dictionary up front, then every placeholder resolves in O(1).
        var patientDisplayName = orderItem.Order.Relative?.Name ?? orderItem.Order.Patient.Phone;

        var mergeFields = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["patient_name"] = patientDisplayName,
            ["patient_phone"] = orderItem.Order.Patient.Phone,
            ["order_number"] = orderItem.Order.OrderNumber,
            ["test_name"] = orderItem.Test.Name,
            ["test_price"] = orderItem.Price.ToString("F2"),
            ["report_date"] = DateTimeOffset.UtcNow.ToString("yyyy-MM-dd"),
        };

        // ---------- 3. Single-pass regex substitution — O(n) over the content, O(1) per match ----------
        // Regex.Replace scans the string ONCE; for every {{placeholder}} match found,
        // the MatchEvaluator does a single Dictionary lookup (O(1)) to resolve it.
        // This is materially better than looping over mergeFields and calling
        // string.Replace() for each key, which would re-scan the whole string
        // once per key (O(k*n) instead of O(n)).
        string MergeContent(string? content) =>
            content is null
                ? string.Empty
                : PlaceholderPattern.Replace(content, match =>
                {
                    var key = match.Groups[1].Value;
                    return mergeFields.TryGetValue(key, out var value) ? value : match.Value;
                    // Unrecognized placeholders are left untouched (match.Value) rather than
                    // silently blanked out — safer default, makes typos visible in the output.
                });

        var document = new ReportDocument
        {
            Id = Guid.NewGuid(),
            OrderItemId = orderItem.Id,
            TemplateId = template.Id,
            HeaderContent = MergeContent(template.HeaderContent),
            FooterContent = MergeContent(template.FooterContent),
            BodyContent = MergeContent(template.BodyContent),
            SourceType = template.SourceType,
            CreatedBy = request.CreatedBy,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.ReportDocuments.Add(document);
        await _db.SaveChangesAsync(cancellationToken);

        return document.Id;
    }
}