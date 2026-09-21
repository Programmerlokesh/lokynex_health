using LokynexHealth.Application.Auth.Commands.Login;
using LokynexHealth.Application.Auth.Commands.SuperAdminLogin;
using LokynexHealth.Application.Auth.Commands.TenantAdminLogin;
using LokynexHealth.Application.Common.Exceptions;
using MediatR;
using Microsoft.Extensions.Logging;

namespace LokynexHealth.Application.Auth.Commands.UnifiedLogin;

public class UnifiedLoginCommandHandler : IRequestHandler<UnifiedLoginCommand, UnifiedLoginResult>
{
    private const string GenericFailure = "Invalid username or password.";

    private readonly IMediator _mediator;
    private readonly ILogger<UnifiedLoginCommandHandler> _logger;

    public UnifiedLoginCommandHandler(IMediator mediator, ILogger<UnifiedLoginCommandHandler> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    public async Task<UnifiedLoginResult> Handle(UnifiedLoginCommand request, CancellationToken cancellationToken)
    {
        var failureMessage = GenericFailure;
        Exception? infrastructureError = null;

        // ---------- 1) Lab user ----------
        try
        {
            var lab = await _mediator.Send(
                new LoginCommand { Username = request.Username, Password = request.Password },
                cancellationToken);

            return new UnifiedLoginResult
            {
                AccountType = "Lab",
                Token = lab.Token,
                UserId = lab.UserId,
                Name = lab.Name,
                Role = lab.Role,
                ExpiresAt = lab.ExpiresAt
            };
        }
        catch (UnauthorizedException ex)
        {
            if (ex.Message != GenericFailure) failureMessage = ex.Message;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lab user lookup failed during unified login.");
            infrastructureError = ex;
        }

        // ---------- 2) Tenant Admin (Create Lab's built-in admin account) ----------
        try
        {
            var tenantAdmin = await _mediator.Send(
                new TenantAdminLoginCommand { Username = request.Username, Password = request.Password },
                cancellationToken);

            return new UnifiedLoginResult
            {
                AccountType = "Lab",
                Token = tenantAdmin.Token,
                UserId = tenantAdmin.TenantId,
                Name = tenantAdmin.Name,
                Role = "LabAdmin",
                ExpiresAt = tenantAdmin.ExpiresAt
            };
        }
        catch (UnauthorizedException ex)
        {
            if (ex.Message != GenericFailure) failureMessage = ex.Message;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Tenant admin lookup failed during unified login.");
            infrastructureError ??= ex;
        }

        // ---------- 3) Platform SuperAdmin ----------
        try
        {
            var admin = await _mediator.Send(
                new SuperAdminLoginCommand { Username = request.Username, Password = request.Password },
                cancellationToken);

            return new UnifiedLoginResult
            {
                AccountType = "SuperAdmin",
                Token = admin.Token,
                UserId = admin.SuperAdminId,
                Name = admin.Name,
                Role = "SuperAdmin",
                ExpiresAt = admin.ExpiresAt
            };
        }
        catch (UnauthorizedException ex)
        {
            if (ex.Message != GenericFailure) failureMessage = ex.Message;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SuperAdmin lookup failed during unified login.");
            infrastructureError ??= ex;
        }

        if (infrastructureError is not null)
            throw infrastructureError;

        throw new UnauthorizedException(failureMessage);
    }
}