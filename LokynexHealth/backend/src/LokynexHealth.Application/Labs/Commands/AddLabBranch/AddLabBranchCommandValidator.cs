using FluentValidation;

namespace LokynexHealth.Application.Labs.Commands.AddLabBranch;

public class AddLabBranchCommandValidator : AbstractValidator<AddLabBranchCommand>
{
    public AddLabBranchCommandValidator()
    {
        RuleFor(x => x.LabId).NotEmpty();
        RuleFor(x => x.BranchName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.BranchCode).NotEmpty().MaximumLength(20);
        RuleFor(x => x.BranchPincode).MaximumLength(10);
        RuleFor(x => x.BranchPhone).MaximumLength(20);
    }
}