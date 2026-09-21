using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Auth.Commands.TenantAdminLogin;

internal class TenantAdminAuthRow
{
    public Guid Id { get; set; }
    public string AdminName { get; set; } = default!;
    public string AdminUsername { get; set; } = default!;
    public string AdminPasswordHash { get; set; } = default!;
    public string SchemaName { get; set; } = default!;
    public string LabCode { get; set; } = default!;
    public string Status { get; set; } = default!;
}

public class TenantAdminLoginCommandHandler : IRequestHandler<TenantAdminLoginCommand, TenantAdminLoginResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _tokenGenerator;

    public TenantAdminLoginCommandHandler(
        IApplicationDbContext db,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator tokenGenerator)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<TenantAdminLoginResult> Handle(TenantAdminLoginCommand request, CancellationToken cancellationToken)
    {
        var tenant = await _db.Database
            .SqlQuery<TenantAdminAuthRow>($@"
                SELECT id, admin_name, admin_username, admin_password_hash,
                       schema_name, lab_code, status::text AS status
                FROM platform.tenants
                WHERE admin_username = {request.Username}")
            .FirstOrDefaultAsync(cancellationToken);

        if (tenant is null || !_passwordHasher.VerifyPassword(request.Password, tenant.AdminPasswordHash))
            throw new UnauthorizedException("Invalid username or password.");

        if (tenant.Status != "Active")
            throw new UnauthorizedException("This lab account is inactive. Contact SuperAdmin.");

        var token = _tokenGenerator.GenerateTenantAdminToken(
            tenant.Id, tenant.AdminUsername, tenant.AdminName, tenant.SchemaName, tenant.LabCode);

        return new TenantAdminLoginResult
        {
            Token = token,
            TenantId = tenant.Id,
            Name = tenant.AdminName,
            SchemaName = tenant.SchemaName,
            LabCode = tenant.LabCode,
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        };
    }
}