using System.Text;
using System.Text.RegularExpressions;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Labs.Commands.CreateLab;

public class CreateLabCommandHandler : IRequestHandler<CreateLabCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITenantProvisioningService _provisioningService;

    public CreateLabCommandHandler(
        IApplicationDbContext db,
        IPasswordHasher passwordHasher,
        ITenantProvisioningService provisioningService)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _provisioningService = provisioningService;
    }

    public async Task<Guid> Handle(CreateLabCommand request, CancellationToken cancellationToken)
    {
        var usernameExists = await _db.Tenants.AnyAsync(t => t.AdminUsername == request.AdminUsername, cancellationToken);
        if (usernameExists)
            throw new ConflictException($"Admin username '{request.AdminUsername}' already in use.");

        var labCode = await GenerateUniqueValueAsync(
            generateCandidate: () => Slugify(request.PrimaryBranchName, 6).ToUpperInvariant(),
            existsCheck: code => _db.Tenants.AnyAsync(t => t.LabCode == code, cancellationToken),
            maxAttempts: 10,
            cancellationToken);

        var subdomain = await GenerateUniqueValueAsync(
            generateCandidate: () => Slugify(request.PrimaryBranchName, 8).ToLowerInvariant(),
            existsCheck: sub => _db.Tenants.AnyAsync(t => t.Subdomain == sub, cancellationToken),
            maxAttempts: 10,
            cancellationToken);

        var schemaName = await GenerateUniqueValueAsync(
            generateCandidate: () => "lab_" + Guid.NewGuid().ToString("N")[..12],
            existsCheck: schema => _db.Tenants.AnyAsync(t => t.SchemaName == schema, cancellationToken),
            maxAttempts: 5,
            cancellationToken);

        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            LabCode = labCode,
            SchemaName = schemaName,
            Subdomain = subdomain,
            PrimaryBranchName = request.PrimaryBranchName,
            PrimaryBranchAddress = request.PrimaryBranchAddress,
            PrimaryBranchPhone = request.PrimaryBranchPhone,
            PrimaryBranchEmail = request.PrimaryBranchEmail,
            PrimaryBranchPincode = request.PrimaryBranchPincode,
            AdminName = request.AdminName,
            AdminPhone = request.AdminPhone,
            AdminAddress = request.AdminAddress,
            AdminEmail = request.AdminEmail,
            AdminUsername = request.AdminUsername,
            AdminPasswordHash = _passwordHasher.HashPassword(request.AdminPassword),
            UserLimit = request.UserLimit,
            Status = PlatformRecordStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.Tenants.Add(tenant);

        foreach (var branchInput in request.ExtendBranches)
        {
            _db.TenantBranches.Add(new TenantBranch
            {
                Id = Guid.NewGuid(),
                TenantId = tenant.Id,
                BranchName = branchInput.BranchName,
                BranchCode = branchInput.BranchCode,
                BranchAddress = branchInput.BranchAddress,
                BranchPincode = branchInput.BranchPincode,
                BranchPhone = branchInput.BranchPhone,
                CreatedAt = DateTimeOffset.UtcNow
            });
        }

        await _db.SaveChangesAsync(cancellationToken);

        // FIX: provisioning fail করলে এখন tenant row rollback (delete) হয়ে যাবে,
        // তাই retry করলে আর ভুয়া 409 আসবে না — আসল এরর দেখা যাবে।
        try
        {
            await _provisioningService.ProvisionTenantSchemaAsync(schemaName, cancellationToken);
        }
        catch
        {
            _db.Tenants.Remove(tenant);
            await _db.SaveChangesAsync(CancellationToken.None);
            throw;
        }

        return tenant.Id;
    }

    private static async Task<string> GenerateUniqueValueAsync(
        Func<string> generateCandidate,
        Func<string, Task<bool>> existsCheck,
        int maxAttempts,
        CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < maxAttempts; attempt++)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var candidate = generateCandidate();
            if (!await existsCheck(candidate))
                return candidate;
        }

        throw new InvalidOperationException("Could not generate a unique value after multiple attempts.");
    }

    private static string Slugify(string input, int randomSuffixLength)
    {
        var baseSlug = Regex.Replace(input.ToLowerInvariant(), @"[^a-z0-9]+", "");
        baseSlug = baseSlug.Length > 10 ? baseSlug[..10] : baseSlug;
        var suffix = Guid.NewGuid().ToString("N")[..randomSuffixLength];
        return $"{baseSlug}{suffix}";
    }
}