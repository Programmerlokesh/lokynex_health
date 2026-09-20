using LokynexHealth.Application.Auth.Commands.Login;
using LokynexHealth.Application.Auth.Commands.SuperAdminLogin;
using LokynexHealth.Application.Common.Exceptions;
using MediatR;
using Microsoft.Extensions.Logging;

namespace LokynexHealth.Application.Auth.Commands.UnifiedLogin;

// Reuses the two existing, already-working handlers instead of duplicating
// their SQL:
//   1) try the LAB user login   (tenant Users table)
//   2) try the SUPERADMIN login (platform.super_admins table)
// Rules that fall out of this:
//   • SuperAdmin username + password  -> a SuperAdmin token (never a lab token)
//   • Lab username + password         -> a lab token
//   • Lab username + SuperAdmin's password (or any other mix) -> 401
//     "Invalid username or password."
//   • If a database lookup itself crashes (e.g. wrong connection string) we
//     surface a 500 instead of pretending the password was wrong.
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
            // Not a lab user (or wrong password). Keep a specific message such
            // as "account is inactive", otherwise stay generic.
            if (ex.Message != GenericFailure) failureMessage = ex.Message;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lab user lookup failed during unified login.");
            infrastructureError = ex;
        }

        // ---------- 2) Platform SuperAdmin ----------
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

        // Neither matched. If one of the lookups crashed, say so (500) rather
        // than blaming the user's password.
        if (infrastructureError is not null)
            throw infrastructureError;

        throw new UnauthorizedException(failureMessage);
    }
}