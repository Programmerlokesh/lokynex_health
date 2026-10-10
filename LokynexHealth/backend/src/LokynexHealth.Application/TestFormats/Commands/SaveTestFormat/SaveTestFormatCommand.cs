using System.Globalization;
using FluentValidation;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.TestFormats.Commands.SaveTestFormat;

public class SaveTestFormatCommand : IRequest
{
    public Guid TestId { get; set; }   // set by the controller from the route

    public string? Specimen { get; set; }
    public string? Method { get; set; }
    public string? MachineName { get; set; }
    public string? ReagentName { get; set; }
    public string? Interpretation { get; set; }

    public List<TestFormatParameterDto> Parameters { get; set; } = new();
}

public class SaveTestFormatCommandValidator : AbstractValidator<SaveTestFormatCommand>
{
    private const decimal MaxAbs = 1_000_000_000m;

    public SaveTestFormatCommandValidator()
    {
        RuleFor(x => x.TestId).NotEmpty();
        RuleFor(x => x.Specimen).MaximumLength(120);
        RuleFor(x => x.Method).MaximumLength(200);
        RuleFor(x => x.MachineName).MaximumLength(150);
        RuleFor(x => x.ReagentName).MaximumLength(200);
        RuleFor(x => x.Parameters).NotNull()
            .Must(p => p.Count <= 200).WithMessage("A format can have at most 200 parameters.");

        RuleForEach(x => x.Parameters).ChildRules(p =>
        {
            p.RuleFor(x => x.Name).NotEmpty().MaximumLength(180)
                .WithMessage("Every parameter needs a name (max 180 characters).");
            p.RuleFor(x => x.SectionName).MaximumLength(100);
            p.RuleFor(x => x.Unit).MaximumLength(40);
            p.RuleFor(x => x.ResultType).Must(t => t is "Auto" or "Numeric" or "Text")
                .WithMessage("Result type must be Auto, Numeric or Text.");
            p.RuleFor(x => x.Ranges).Must(r => r.Count <= 12)
                .WithMessage("A parameter can have at most 12 reference ranges.");

            p.RuleForEach(x => x.Ranges).ChildRules(r =>
            {
                r.RuleFor(x => x.Gender)
                    .Must(g => string.IsNullOrEmpty(g) || g is "Male" or "Female" or "Other")
                    .WithMessage("Range gender must be Male, Female or Other.");
                r.RuleFor(x => x.NormalText).MaximumLength(100);
                r.RuleFor(x => x.DisplayText).MaximumLength(150);
                r.RuleFor(x => x).Must(x =>
                        x.LowValue is not null || x.HighValue is not null ||
                        !string.IsNullOrWhiteSpace(x.NormalText) || !string.IsNullOrWhiteSpace(x.DisplayText))
                    .WithMessage("Each reference range needs a low/high value or a normal text.");
                r.RuleFor(x => x).Must(x => x.LowValue is null || x.HighValue is null || x.LowValue <= x.HighValue)
                    .WithMessage("Range low value cannot be greater than the high value.");
                r.RuleFor(x => x).Must(x => x.AgeMinDays is null || x.AgeMaxDays is null || x.AgeMinDays <= x.AgeMaxDays)
                    .WithMessage("Range age 'from' cannot be greater than age 'to'.");
                r.RuleFor(x => x).Must(x =>
                        Within(x.LowValue) && Within(x.HighValue) && Within(x.CriticalLow) && Within(x.CriticalHigh))
                    .WithMessage("A range value is too large.");
            });
        });
    }

    private static bool Within(decimal? v) => v is null || Math.Abs(v.Value) < MaxAbs;
}

public class SaveTestFormatCommandHandler : IRequestHandler<SaveTestFormatCommand>
{
    private readonly IApplicationDbContext _db;

    public SaveTestFormatCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    private static string Norm(string? v) => (v ?? string.Empty).Trim().ToLowerInvariant();
    private static string? Clean(string? v) => string.IsNullOrWhiteSpace(v) ? null : v.Trim();

    private static string Fmt(decimal? v) => (v ?? 0).ToString("0.####", CultureInfo.InvariantCulture);

    private static string AutoDisplay(TestFormatRangeDto r)
    {
        if (!string.IsNullOrWhiteSpace(r.NormalText)) return r.NormalText.Trim();
        if (r.LowValue is not null && r.HighValue is not null) return $"{Fmt(r.LowValue)} - {Fmt(r.HighValue)}";
        if (r.HighValue is not null) return $"<{Fmt(r.HighValue)}";
        return $">{Fmt(r.LowValue)}";
    }

    private static TestReferenceRange MapRange(Guid parameterId, TestFormatRangeDto r)
    {
        GenderType? gender = r.Gender switch
        {
            "Male" => GenderType.Male,
            "Female" => GenderType.Female,
            "Other" => GenderType.Other,
            _ => null
        };

        return new TestReferenceRange
        {
            Id = Guid.NewGuid(),
            ParameterId = parameterId,
            Gender = gender,
            AgeMinDays = r.AgeMinDays,
            AgeMaxDays = r.AgeMaxDays,
            LowValue = r.LowValue,
            HighValue = r.HighValue,
            CriticalLow = r.CriticalLow,
            CriticalHigh = r.CriticalHigh,
            NormalText = Clean(r.NormalText),
            DisplayText = Clean(r.DisplayText) ?? AutoDisplay(r)
        };
    }

    public async Task Handle(SaveTestFormatCommand request, CancellationToken ct)
    {
        var test = await _db.Tests.FirstOrDefaultAsync(t => t.Id == request.TestId, ct)
            ?? throw new NotFoundException(nameof(Test), request.TestId);

        var input = request.Parameters;

        var dupe = input
            .GroupBy(p => (Norm(p.SectionName), Norm(p.Name)))
            .FirstOrDefault(g => g.Count() > 1);
        if (dupe is not null)
            throw new ConflictException($"\"{dupe.First().Name.Trim()}\" is added twice in the same section.");

        var existing = await _db.TestParameters
            .Include(p => p.ReferenceRanges)
            .Where(p => p.TestId == test.Id && p.Status == RecordStatus.Active)
            .ToListAsync(ct);

        var byId = existing.ToDictionary(p => p.Id);
        var byKey = existing
            .GroupBy(p => (Norm(p.SectionName), Norm(p.Name)))
            .ToDictionary(g => g.Key, g => g.First());

        var claimed = new HashSet<Guid>();
        var now = DateTimeOffset.UtcNow;
        var sortOrder = 0;

        foreach (var dto in input)
        {
            sortOrder += 10;

            TestParameter? p = null;
            if (dto.Id is Guid id && byId.TryGetValue(id, out var hitById) && !claimed.Contains(id))
                p = hitById;
            else if (byKey.TryGetValue((Norm(dto.SectionName), Norm(dto.Name)), out var hitByKey)
                     && !claimed.Contains(hitByKey.Id))
                p = hitByKey;   // same name re-added -> reuse the row (avoids unique-key clash)

            if (p is null)
            {
                p = new TestParameter
                {
                    Id = Guid.NewGuid(),
                    TestId = test.Id,
                    Status = RecordStatus.Active,
                    CreatedAt = now
                };
                _db.TestParameters.Add(p);
            }
            else
            {
                claimed.Add(p.Id);
                p.UpdatedAt = now;
                _db.TestReferenceRanges.RemoveRange(p.ReferenceRanges.ToList());   // ranges are replaced
            }

            p.SectionName = (dto.SectionName ?? string.Empty).Trim();
            p.Name = dto.Name.Trim();
            p.Unit = Clean(dto.Unit);
            p.ResultType = dto.ResultType;
            p.IsBold = dto.IsBold;
            p.SortOrder = sortOrder;

            foreach (var r in dto.Ranges)
                _db.TestReferenceRanges.Add(MapRange(p.Id, r));
        }

        // Parameters removed from the format
        foreach (var old in existing.Where(x => !claimed.Contains(x.Id)))
        {
            var used = await _db.ReportResults.AnyAsync(r => r.ParameterId == old.Id, ct);
            if (used)
            {
                // old reports still point at it: hide it instead of deleting
                var baseName = old.Name.Length > 180 ? old.Name[..180] : old.Name;
                old.Name = $"{baseName} [removed {old.Id.ToString("N")[..6]}]";
                old.Status = RecordStatus.Inactive;
                old.UpdatedAt = now;
            }
            else
            {
                _db.TestParameters.Remove(old);
            }
        }

        // Specimen / method / machine / reagent defaults
        var info = await _db.TestReportInfos.FirstOrDefaultAsync(x => x.TestId == test.Id, ct);
        if (info is null)
        {
            info = new TestReportInfo { TestId = test.Id };
            _db.TestReportInfos.Add(info);
        }
        info.Specimen = Clean(request.Specimen);
        info.Method = Clean(request.Method);
        info.MachineName = Clean(request.MachineName);
        info.ReagentName = Clean(request.ReagentName);
        info.Interpretation = Clean(request.Interpretation);
        info.UpdatedAt = now;

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            throw new ConflictException(
                "Could not save the format. Two parameters probably share the same name in one section. " +
                "Save the removal first, then rename.");
        }
    }
}