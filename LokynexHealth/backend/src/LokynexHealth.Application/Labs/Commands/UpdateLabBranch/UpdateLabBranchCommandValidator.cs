using FluentValidation;

namespace LokynexHealth.Application.Labs.Commands.UpdateLabBranch;

public class UpdateLabBranchCommandValidator : AbstractValidator<UpdateLabBranchCommand>
{
    public UpdateLabBranchCommandValidator()
    {
        RuleFor(x => x.LabId).NotEmpty();
        RuleFor(x => x.BranchId).NotEmpty();
        RuleFor(x => x.BranchName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.BranchPincode).MaximumLength(10);
        RuleFor(x => x.BranchPhone).MaximumLength(20);
        RuleFor(x => x.Status).Must(s => s == "Active" || s == "Inactive")
            .WithMessage("Status must be 'Active' or 'Inactive'.");
    }
}