using FluentValidation;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

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
}

/// <summary>
/// Called by the "save report" / "save test format" handlers: a machine or reagent that
/// was typed by hand is added to the pick-list automatically (no duplicates, case-insensitive).
/// Does NOT call SaveChanges - the caller's own SaveChanges stores it.
/// </summary>
public static class ReportOptionSync
{
    public static async Task EnsureAsync(
        IApplicationDbContext db, string kind, string? name, CancellationToken ct)
    {
        var clean = name?.Trim();
        if (string.IsNullOrEmpty(clean)) return;
        if (clean.Length > ReportOptionKinds.MaxLength(kind)) return;

        var lower = clean.ToLower();
        var exists = await db.ReportOptions
            .AnyAsync(o => o.Kind == kind && o.Name.ToLower() == lower, ct);
        if (exists) return;

        db.ReportOptions.Add(new ReportOption
        {
            Id = Guid.NewGuid(),
            Kind = kind,
            Name = clean,
            CreatedAt = DateTimeOffset.UtcNow
        });
    }
}

// ---------------------------------------------------------------- list
public class GetReportOptionsQuery : IRequest<List<ReportOptionDto>>
{
    /// <summary>Machine | Reagent. Empty = both.</summary>
    public string? Kind { get; set; }
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
        var q = _db.ReportOptions.AsNoTracking();
        if (ReportOptionKinds.IsValid(request.Kind))
            q = q.Where(o => o.Kind == request.Kind);

        return await q
            .OrderBy(o => o.Kind).ThenBy(o => o.Name)
            .Select(o => new ReportOptionDto { Id = o.Id, Kind = o.Kind, Name = o.Name })
            .ToListAsync(ct);
    }
}

// ---------------------------------------------------------------- create
public class CreateReportOptionCommand : IRequest<ReportOptionDto>
{
    public string Kind { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
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
                CreatedAt = DateTimeOffset.UtcNow
            };
            _db.ReportOptions.Add(existing);
            await _db.SaveChangesAsync(ct);
        }

        return new ReportOptionDto { Id = existing.Id, Kind = existing.Kind, Name = existing.Name };
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