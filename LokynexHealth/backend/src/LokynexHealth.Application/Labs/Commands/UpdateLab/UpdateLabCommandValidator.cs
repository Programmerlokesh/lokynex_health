using FluentValidation;

namespace LokynexHealth.Application.Labs.Commands.UpdateLab;

public class UpdateLabCommandValidator : AbstractValidator<UpdateLabCommand>
{
    private static readonly string[] AllowedStatuses = { "Active", "Inactive", "Suspended" };

    public UpdateLabCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();

        RuleFor(x => x.PrimaryBranchName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.PrimaryBranchAddress).NotEmpty();
        RuleFor(x => x.PrimaryBranchPhone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.PrimaryBranchEmail).NotEmpty().EmailAddress();
        RuleFor(x => x.PrimaryBranchPincode).NotEmpty().MaximumLength(10);

        RuleFor(x => x.AdminName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.AdminPhone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.AdminEmail).NotEmpty().EmailAddress();

        RuleFor(x => x.UserLimit).GreaterThan(0);

        RuleFor(x => x.Status)
            .NotEmpty()
            .Must(s => AllowedStatuses.Contains(s))
            .WithMessage($"Status must be one of: {string.Join(", ", AllowedStatuses)}.");
    }
}