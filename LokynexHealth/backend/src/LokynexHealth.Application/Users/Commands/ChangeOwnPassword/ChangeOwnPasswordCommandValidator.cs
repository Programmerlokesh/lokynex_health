using FluentValidation;

namespace LokynexHealth.Application.Users.Commands.ChangeOwnPassword;

public class ChangeOwnPasswordCommandValidator : AbstractValidator<ChangeOwnPasswordCommand>
{
    public ChangeOwnPasswordCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.CurrentPassword).NotEmpty()
            .WithMessage("Current password is required.");
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(8)
            .WithMessage("New password must be at least 8 characters.");
        RuleFor(x => x.NewPassword)
            .NotEqual(x => x.CurrentPassword)
            .WithMessage("New password must be different from the current password.");
    }
}