using FluentValidation;

namespace LokynexHealth.Application.Branches.Commands.UpdateBranch;

public class UpdateBranchCommandValidator : AbstractValidator<UpdateBranchCommand>
{
    public UpdateBranchCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.BranchName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.BranchPincode).MaximumLength(10);
        RuleFor(x => x.BranchPhone).MaximumLength(20);
        RuleFor(x => x.Status).Must(s => s == "Active" || s == "Inactive")
            .WithMessage("Status must be 'Active' or 'Inactive'.");
    }
}