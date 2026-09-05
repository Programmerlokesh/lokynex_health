using FluentValidation;

namespace LokynexHealth.Application.Technicians.Commands.CreateTechnician;

public class CreateTechnicianCommandValidator : AbstractValidator<CreateTechnicianCommand>
{
    public CreateTechnicianCommandValidator()
    {
        RuleFor(x => x.BranchId).NotEmpty();
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
    }
}