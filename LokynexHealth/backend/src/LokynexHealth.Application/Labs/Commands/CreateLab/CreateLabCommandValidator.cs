using FluentValidation;

namespace LokynexHealth.Application.Labs.Commands.CreateLab;

public class CreateLabCommandValidator : AbstractValidator<CreateLabCommand>
{
    public CreateLabCommandValidator()
    {
        RuleFor(x => x.PrimaryBranchName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.PrimaryBranchPhone).NotEmpty();
        RuleFor(x => x.PrimaryBranchEmail).NotEmpty().EmailAddress();
        RuleFor(x => x.AdminUsername).NotEmpty().MaximumLength(100);
        RuleFor(x => x.AdminEmail).NotEmpty().EmailAddress();
        RuleFor(x => x.AdminPassword).NotEmpty().MinimumLength(8);
        RuleFor(x => x.UserLimit).GreaterThan(0);
    }
}