using FluentValidation;
using LokynexHealth.Application.Common;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.OwnerLedger;

public interface IOwnerLedgerEntryFields
{
    DateOnly EntryDate { get; }
    string EntryType { get; }
    string? Category { get; }
    decimal Amount { get; }
    Guid? TenantId { get; }
    string? PaymentMethod { get; }
    string? ReferenceNo { get; }
    string? Description { get; }
}

public class RecordOwnerLedgerEntryCommand : IRequest<Guid>, IOwnerLedgerEntryFields
{
    public DateOnly EntryDate { get; set; }
    public string EntryType { get; set; } = default!;
    public string? Category { get; set; }
    public decimal Amount { get; set; }
    public Guid? TenantId { get; set; }
    public string? PaymentMethod { get; set; }
    public string? ReferenceNo { get; set; }
    public string? Description { get; set; }
}

public class UpdateOwnerLedgerEntryCommand : IRequest, IOwnerLedgerEntryFields
{
    public Guid Id { get; set; }
    public DateOnly EntryDate { get; set; }
    public string EntryType { get; set; } = default!;
    public string? Category { get; set; }
    public decimal Amount { get; set; }
    public Guid? TenantId { get; set; }
    public string? PaymentMethod { get; set; }
    public string? ReferenceNo { get; set; }
    public string? Description { get; set; }
}

public class DeleteOwnerLedgerEntryCommand : IRequest
{
    public Guid Id { get; set; }
}

internal static class OwnerLedgerEntryRules
{
    public static void Apply<T>(AbstractValidator<T> v) where T : IOwnerLedgerEntryFields
    {
        v.RuleFor(x => x.EntryType).Must(t => OwnerLedgerTypes.All.Contains(t))
            .WithMessage("Choose a valid entry type.");
        v.RuleFor(x => x.Amount).GreaterThan(0).LessThan(1_000_000_000m);
        v.RuleFor(x => x.EntryDate)
            .Must(d => d.Year >= 2000 && d <= DateOnly.FromDateTime(DateTime.UtcNow).AddDays(366))
            .WithMessage("Entry date is out of range.");
        v.RuleFor(x => x.Category).MaximumLength(60);
        v.RuleFor(x => x.PaymentMethod).MaximumLength(30);
        v.RuleFor(x => x.ReferenceNo).MaximumLength(60);
        v.RuleFor(x => x.Description).MaximumLength(500);
    }

    public static string? Clean(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    /// <summary>The lab (if any) must be one THIS owner added.</summary>
    public static async Task EnsureOwnLabAsync(IApplicationDbContext db, Guid ownerId, Guid? tenantId, CancellationToken ct)
    {
        if (tenantId is null) return;
        var id = tenantId.Value;
        if (!await db.Tenants.AnyAsync(t => t.Id == id && t.CreatedByOwnerId == ownerId, ct))
            throw new NotFoundException("Lab", id);
    }
}

public class RecordOwnerLedgerEntryCommandValidator : AbstractValidator<RecordOwnerLedgerEntryCommand>
{
    public RecordOwnerLedgerEntryCommandValidator() => OwnerLedgerEntryRules.Apply(this);
}

public class UpdateOwnerLedgerEntryCommandValidator : AbstractValidator<UpdateOwnerLedgerEntryCommand>
{
    public UpdateOwnerLedgerEntryCommandValidator() => OwnerLedgerEntryRules.Apply(this);
}

public class RecordOwnerLedgerEntryCommandHandler : IRequestHandler<RecordOwnerLedgerEntryCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public RecordOwnerLedgerEntryCommandHandler(IApplicationDbContext db, ICurrentUserService user)
    {
        _db = db;
        _user = user;
    }

    public async Task<Guid> Handle(RecordOwnerLedgerEntryCommand r, CancellationToken ct)
    {
        var owner = await OwnerAccess.RequireActiveOwnerAsync(_db, _user, ct);
        await OwnerLedgerEntryRules.EnsureOwnLabAsync(_db, owner.Id, r.TenantId, ct);

        var e = new OwnerLedgerEntry
        {
            Id = Guid.NewGuid(),
            OwnerId = owner.Id,
            EntryDate = r.EntryDate,
            EntryType = r.EntryType,
            Category = OwnerLedgerEntryRules.Clean(r.Category),
            TenantId = r.TenantId,
            Amount = Math.Round(r.Amount, 2),
            PaymentMethod = OwnerLedgerEntryRules.Clean(r.PaymentMethod),
            ReferenceNo = OwnerLedgerEntryRules.Clean(r.ReferenceNo),
            Description = OwnerLedgerEntryRules.Clean(r.Description),
            CreatedAt = DateTimeOffset.UtcNow
        };
        _db.OwnerLedgerEntries.Add(e);
        await _db.SaveChangesAsync(ct);
        return e.Id;
    }
}

public class UpdateOwnerLedgerEntryCommandHandler : IRequestHandler<UpdateOwnerLedgerEntryCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public UpdateOwnerLedgerEntryCommandHandler(IApplicationDbContext db, ICurrentUserService user)
    {
        _db = db;
        _user = user;
    }

    public async Task Handle(UpdateOwnerLedgerEntryCommand r, CancellationToken ct)
    {
        var owner = await OwnerAccess.RequireActiveOwnerAsync(_db, _user, ct);
        var e = await _db.OwnerLedgerEntries.FirstOrDefaultAsync(x => x.Id == r.Id && x.OwnerId == owner.Id, ct)
            ?? throw new NotFoundException("Ledger entry", r.Id);
        await OwnerLedgerEntryRules.EnsureOwnLabAsync(_db, owner.Id, r.TenantId, ct);

        e.EntryDate = r.EntryDate;
        e.EntryType = r.EntryType;
        e.Category = OwnerLedgerEntryRules.Clean(r.Category);
        e.TenantId = r.TenantId;
        e.Amount = Math.Round(r.Amount, 2);
        e.PaymentMethod = OwnerLedgerEntryRules.Clean(r.PaymentMethod);
        e.ReferenceNo = OwnerLedgerEntryRules.Clean(r.ReferenceNo);
        e.Description = OwnerLedgerEntryRules.Clean(r.Description);
        e.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}

public class DeleteOwnerLedgerEntryCommandHandler : IRequestHandler<DeleteOwnerLedgerEntryCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _user;
    public DeleteOwnerLedgerEntryCommandHandler(IApplicationDbContext db, ICurrentUserService user)
    {
        _db = db;
        _user = user;
    }

    public async Task Handle(DeleteOwnerLedgerEntryCommand r, CancellationToken ct)
    {
        var owner = await OwnerAccess.RequireActiveOwnerAsync(_db, _user, ct);
        var e = await _db.OwnerLedgerEntries.FirstOrDefaultAsync(x => x.Id == r.Id && x.OwnerId == owner.Id, ct)
            ?? throw new NotFoundException("Ledger entry", r.Id);
        _db.OwnerLedgerEntries.Remove(e);
        await _db.SaveChangesAsync(ct);
    }
}