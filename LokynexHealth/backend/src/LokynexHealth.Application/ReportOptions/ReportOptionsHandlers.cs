using System.Text.RegularExpressions;
using FluentValidation;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace LokynexHealth.Application.ReportOptions;

public static class ReportOptionKinds
{
    public const string Machine = "Machine";
    public const string Reagent = "Reagent";

    public static bool IsValid(string? kind) => kind is Machine or Reagent;

    // report_documents.machine_name = 150, reagent_name = 200
    public static int MaxLength(string kind) => kind == Machine ? 150 : 200;
}

public class ReportOptionDto
{
    public Guid Id { get; set; }
    public string Kind { get; set; } = default!;
    public string Name { get; set; } = default!;
    /// <summary>Comma separated test categories; null = every test.</summary>
    public string? Categories { get; set; }
}

/// <summary>
/// Which kind of test a report belongs to -> decides which machines / reagents are offered.
/// Test-name rules win, then the department name. Unknown = null = show every option.
/// </summary>
public static class ReportOptionCategories
{
    public const string Haematology = "Haematology";
    public const string Biochemistry = "Biochemistry";
    public const string Immunoassay = "Immunoassay";
    public const string Serology = "Serology";
    public const string Coagulation = "Coagulation";
    public const string HbA1c = "HbA1c";

    private const RegexOptions Opt = RegexOptions.IgnoreCase | RegexOptions.Compiled;

    private static readonly Regex HbA1cRx = new(@"hba1c|glycosylated|glycated|\ba1c\b", Opt);

    private static readonly Regex CoagRx = new(
        @"\bpt\b|\binr\b|a?ptt\b|prothrombin|thromboplastin|coagulation|fibrinogen|d-?dimer", Opt);

    private static readonly Regex HaemRx = new(
        @"\bcbc\b|complete blood|h(a)?emogram|h(a)?emoglobin|\bhb\b|\besr\b|erythrocyte|leuko?cyte|\btlc\b|\bdlc\b|" +
        @"differential|platelet|\brbc\b|\bwbc\b|\bpcv\b|h(a)?ematocrit|\bmcv\b|\bmchc?\b|\brdw\b|reticulocyte|" +
        @"smear|eosinophil|neutrophil|lymphocyte|monocyte|basophil", Opt);

    private static readonly Regex SeroRx = new(
        @"widal|typhi|dengue|\bhiv\b|hbsag|\bhcv\b|hepatitis|\bhav\b|\bhev\b|vdrl|\brpr\b|syphilis|malaria|" +
        @"rheumatoid|\bra factor|\baso\b|chikungunya|leptospira|brucella|\btpha\b", Opt);

    private static readonly Regex ImmunoRx = new(
        @"\btsh\b|thyroid|\bt3\b|\bt4\b|\bft3\b|\bft4\b|troponin|ck-?mb|ferritin|vitamin|\bb12\b|folate|folic|" +
        @"\bpsa\b|\bcea\b|\bafp\b|\bca ?(125|19-?9|15-?3)|cortisol|prolactin|\bfsh\b|\blh\b|testosterone|" +
        @"o?estradiol|progesterone|hcg|insulin|\bpth\b|parathyroid|procalcitonin|\bbnp\b|anti-?ccp|\bige\b|\bamh\b|" +
        @"homocysteine", Opt);

    private static readonly Regex ChemRx = new(
        @"glucose|sugar|\bfbs\b|\bppbs\b|\brbs\b|ogtt|urea|\bbun\b|creatinine|uric|bilirubin|\bsgot\b|\bsgpt\b|" +
        @"\bast\b|\balt\b|\balp\b|\bggt\b|alkaline|protein|albumin|globulin|cholesterol|triglycerid|\bhdl\b|" +
        @"\bldl\b|\bvldl\b|lipid|\blft\b|\bkft\b|\brft\b|liver function|kidney function|renal|calcium|phosph|" +
        @"magnesium|sodium|potassium|chloride|electrolyte|amylase|lipase|\bldh\b|\biron\b|\btibc\b|\bcrp\b|" +
        @"c-?reactive|\bcpk\b|creatine kinase", Opt);

    public static string? ForTest(string? department, string? testName)
    {
        var name = testName ?? string.Empty;
        if (HbA1cRx.IsMatch(name)) return HbA1c;
        if (CoagRx.IsMatch(name)) return Coagulation;
        if (HaemRx.IsMatch(name)) return Haematology;
        if (SeroRx.IsMatch(name)) return Serology;
        if (ImmunoRx.IsMatch(name)) return Immunoassay;
        if (ChemRx.IsMatch(name)) return Biochemistry;

        var d = (department ?? string.Empty).ToLowerInvariant();
        if (d.Contains("haemat") || d.Contains("hemat")) return Haematology;
        if (d.Contains("coag")) return Coagulation;
        if (d.Contains("serolog")) return Serology;
        if (d.Contains("immun") || d.Contains("hormon") || d.Contains("endocrin") ||
            d.Contains("cardiac") || d.Contains("tumo") || d.Contains("vitamin")) return Immunoassay;
        if (d.Contains("biochem") || d.Contains("clinical chem")) return Biochemistry;
        return null;
    }

    /// <summary>Category of a test row (null when the test is unknown / not recognised).</summary>
    public static async Task<string?> ForTestIdAsync(IApplicationDbContext db, Guid? testId, CancellationToken ct)
    {
        if (testId is null || testId == Guid.Empty) return null;
        var t = await db.Tests.AsNoTracking()
            .Where(x => x.Id == testId.Value)
            .Select(x => new { x.Name, Department = x.Department.Name })
            .FirstOrDefaultAsync(ct);
        return t is null ? null : ForTest(t.Department, t.Name);
    }
}

/// <summary>
/// Self-healing: if the report_options table does not exist yet (SQL 018 not run),
/// create it and fill the starter machine / reagent names, then carry on.
/// </summary>
public static class ReportOptionsSchema
{
    private static readonly string[] Machines =
    {
        "Sysmex XN-1000", "Sysmex XN-350", "Sysmex XP-100", "Mindray BC-5150", "Mindray BC-5000",
        "Mindray BC-3000 Plus", "Erba H 360", "Erba H 560", "Horiba Micros 60", "Beckman Coulter DxH 520",
        "Transasia XL-640", "Transasia EM 200", "Erba Chem 5X", "Mindray BS-240", "Mindray BS-200E",
        "Roche Cobas c311", "Roche Cobas e411", "Roche Cobas 6000", "Abbott Architect i1000SR",
        "Abbott Architect c4000", "Siemens Atellica", "Beckman Coulter Access 2", "Vitros ECi",
        "Tosoh G8 (HbA1c)", "Bio-Rad D-10 (HbA1c)", "Erba ECL 105 (Coagulometer)",
        "Stago Start 4 (Coagulometer)", "Manual method"
    };

    private static readonly string[] Reagents =
    {
        "Sysmex Cellpack / Stromatolyser", "Mindray M-30 series reagents", "Erba Diluent / Lyse",
        "Horiba ABX Diluent / Lyse", "Beckman Coulter DxH reagents", "Transasia Autopak reagents",
        "Erba Mannheim reagents", "Randox reagents", "Agappe Diagnostics reagents",
        "Coral Clinical Systems reagents", "Roche Cobas reagents", "Abbott Architect reagents",
        "Siemens reagents", "Beckman Coulter reagents", "Biorad reagents", "Tulip Diagnostics kit",
        "Span Diagnostics kit", "J. Mitra kit", "Meril Diagnostics kit", "Manual kit"
    };

    /// <summary>
    /// True when the exception is PostgreSQL "relation does not exist" (42P01)
    /// or "column does not exist" (42703, SQL 024 not run yet).
    /// </summary>
    public static bool IsMissingTable(Exception ex)
    {
        for (var e = ex; e is not null; e = e.InnerException)
            if (e is PostgresException { SqlState: "42P01" or "42703" }) return true;
        return false;
    }

    private static string Arr(IEnumerable<string> items) =>
        "ARRAY[" + string.Join(",", items.Select(x => "'" + x.Replace("'", "''") + "'")) + "]";

    public static async Task EnsureAsync(IApplicationDbContext db, CancellationToken ct)
    {
        await db.Database.ExecuteSqlRawAsync(
            "CREATE TABLE IF NOT EXISTS report_options (" +
            " id UUID PRIMARY KEY DEFAULT gen_random_uuid()," +
            " kind VARCHAR(10) NOT NULL CHECK (kind IN ('Machine', 'Reagent'))," +
            " name VARCHAR(200) NOT NULL," +
            " created_at TIMESTAMPTZ NOT NULL DEFAULT now()," +
            " updated_at TIMESTAMPTZ);",
            ct);

        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE report_options ADD COLUMN IF NOT EXISTS categories VARCHAR(200);",
            ct);

        await db.Database.ExecuteSqlRawAsync(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_report_options_kind_name ON report_options (kind, lower(name));",
            ct);

        await db.Database.ExecuteSqlRawAsync(
            "INSERT INTO report_options (kind, name) " +
            "SELECT 'Machine', n FROM unnest(" + Arr(Machines) + ") AS n " +
            "UNION ALL " +
            "SELECT 'Reagent', n FROM unnest(" + Arr(Reagents) + ") AS n " +
            "ON CONFLICT DO NOTHING;",
            ct);
    }
}

/// <summary>
/// Called by the "save report" / "save test format" handlers: a machine or reagent that
/// was typed by hand is added to the pick-list automatically (no duplicates, case-insensitive).
/// Does NOT call SaveChanges - the caller's own SaveChanges stores it.
/// </summary>
public static class ReportOptionSync
{
    public static async Task EnsureAsync(
        IApplicationDbContext db, string kind, string? name, CancellationToken ct,
        string? category = null)
    {
        var clean = name?.Trim();
        if (string.IsNullOrEmpty(clean)) return;
        if (clean.Length > ReportOptionKinds.MaxLength(kind)) return;

        var lower = clean.ToLower();
        bool exists;
        try
        {
            exists = await db.ReportOptions
                .AnyAsync(o => o.Kind == kind && o.Name.ToLower() == lower, ct);
        }
        catch (Exception ex) when (ReportOptionsSchema.IsMissingTable(ex))
        {
            await ReportOptionsSchema.EnsureAsync(db, ct);
            exists = await db.ReportOptions
                .AnyAsync(o => o.Kind == kind && o.Name.ToLower() == lower, ct);
        }
        if (exists) return;

        db.ReportOptions.Add(new ReportOption
        {
            Id = Guid.NewGuid(),
            Kind = kind,
            Name = clean,
            Categories = category,
            CreatedAt = DateTimeOffset.UtcNow
        });
    }
}

// ---------------------------------------------------------------- list
public class GetReportOptionsQuery : IRequest<List<ReportOptionDto>>
{
    /// <summary>Machine | Reagent. Empty = both.</summary>
    public string? Kind { get; set; }

    /// <summary>
    /// When set, only machines / reagents that fit this test are returned
    /// (plus the ones that are not tied to any category, e.g. "Manual method").
    /// </summary>
    public Guid? TestId { get; set; }
}

public class GetReportOptionsQueryHandler : IRequestHandler<GetReportOptionsQuery, List<ReportOptionDto>>
{
    private readonly IApplicationDbContext _db;

    public GetReportOptionsQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<ReportOptionDto>> Handle(GetReportOptionsQuery request, CancellationToken ct)
    {
        try
        {
            return await LoadAsync(request, ct);
        }
        catch (Exception ex) when (ReportOptionsSchema.IsMissingTable(ex))
        {
            // table not created yet -> create + seed it, then answer normally
            await ReportOptionsSchema.EnsureAsync(_db, ct);
            return await LoadAsync(request, ct);
        }
    }

    private async Task<List<ReportOptionDto>> LoadAsync(GetReportOptionsQuery request, CancellationToken ct)
    {
        var q = _db.ReportOptions.AsNoTracking();
        if (ReportOptionKinds.IsValid(request.Kind))
            q = q.Where(o => o.Kind == request.Kind);

        var category = await ReportOptionCategories.ForTestIdAsync(_db, request.TestId, ct);
        if (category is not null)
        {
            var tag = "," + category + ",";
            q = q.Where(o => o.Categories == null || ("," + o.Categories + ",").Contains(tag));
        }

        return await q
            .OrderBy(o => o.Kind).ThenBy(o => o.Name)
            .Select(o => new ReportOptionDto
            {
                Id = o.Id,
                Kind = o.Kind,
                Name = o.Name,
                Categories = o.Categories
            })
            .ToListAsync(ct);
    }
}

// ---------------------------------------------------------------- create
public class CreateReportOptionCommand : IRequest<ReportOptionDto>
{
    public string Kind { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;

    /// <summary>The test being reported / edited: the new name is filed under that test's category.</summary>
    public Guid? TestId { get; set; }
}

public class CreateReportOptionCommandValidator : AbstractValidator<CreateReportOptionCommand>
{
    public CreateReportOptionCommandValidator()
    {
        RuleFor(x => x.Kind).Must(ReportOptionKinds.IsValid)
            .WithMessage("Kind must be Machine or Reagent.");
        RuleFor(x => x.Name).NotEmpty().WithMessage("Name is required.");
        RuleFor(x => x).Must(x =>
                !ReportOptionKinds.IsValid(x.Kind) || (x.Name ?? string.Empty).Trim().Length <= ReportOptionKinds.MaxLength(x.Kind))
            .WithMessage("Name is too long.");
    }
}

public class CreateReportOptionCommandHandler : IRequestHandler<CreateReportOptionCommand, ReportOptionDto>
{
    private readonly IApplicationDbContext _db;

    public CreateReportOptionCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ReportOptionDto> Handle(CreateReportOptionCommand request, CancellationToken ct)
    {
        var name = request.Name.Trim();
        var lower = name.ToLower();

        var existing = await _db.ReportOptions
            .FirstOrDefaultAsync(o => o.Kind == request.Kind && o.Name.ToLower() == lower, ct);

        if (existing is null)
        {
            existing = new ReportOption
            {
                Id = Guid.NewGuid(),
                Kind = request.Kind,
                Name = name,
                Categories = await ReportOptionCategories.ForTestIdAsync(_db, request.TestId, ct),
                CreatedAt = DateTimeOffset.UtcNow
            };
            _db.ReportOptions.Add(existing);
            await _db.SaveChangesAsync(ct);
        }

        return new ReportOptionDto
        {
            Id = existing.Id,
            Kind = existing.Kind,
            Name = existing.Name,
            Categories = existing.Categories
        };
    }
}

// ---------------------------------------------------------------- delete
public class DeleteReportOptionCommand : IRequest
{
    public Guid Id { get; set; }
}

public class DeleteReportOptionCommandHandler : IRequestHandler<DeleteReportOptionCommand>
{
    private readonly IApplicationDbContext _db;

    public DeleteReportOptionCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(DeleteReportOptionCommand request, CancellationToken ct)
    {
        var option = await _db.ReportOptions.FirstOrDefaultAsync(o => o.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(ReportOption), request.Id);

        // Reports already saved keep their own printed text, so removing it from the list is safe.
        _db.ReportOptions.Remove(option);
        await _db.SaveChangesAsync(ct);
    }
}