using FluentValidation;

namespace LokynexHealth.Application.Auth.Commands.UnifiedLogin;

public class UnifiedLoginCommandValidator : AbstractValidator<UnifiedLoginCommand>
{
    public UnifiedLoginCommandValidator()
    {
        RuleFor(x => x.Username).NotEmpty();
        RuleFor(x => x.Password).NotEmpty();
    }
}