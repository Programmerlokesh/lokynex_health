using FluentValidation;

namespace LokynexHealth.Application.Auth.Commands.SuperAdminLogin;

public class SuperAdminLoginCommandValidator : AbstractValidator<SuperAdminLoginCommand>
{
    public SuperAdminLoginCommandValidator()
    {
        RuleFor(x => x.Username).NotEmpty();
        RuleFor(x => x.Password).NotEmpty();
    }
}