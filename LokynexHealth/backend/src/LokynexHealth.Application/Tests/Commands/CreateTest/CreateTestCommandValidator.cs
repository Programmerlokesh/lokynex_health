using FluentValidation;

namespace LokynexHealth.Application.Tests.Commands.CreateTest;

public class CreateTestCommandValidator : AbstractValidator<CreateTestCommand>
{
    public CreateTestCommandValidator()
    {
        RuleFor(x => x.DepartmentId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0);

        RuleFor(x => x.DoctorCommissionType).Must(BeValidCommissionType);
        RuleFor(x => x.ReferralCommissionType).Must(BeValidCommissionType);
        RuleFor(x => x.TechnicianCommissionType).Must(BeValidCommissionType);

        RuleFor(x => x.DoctorCommissionValue).GreaterThanOrEqualTo(0);
        RuleFor(x => x.ReferralCommissionValue).GreaterThanOrEqualTo(0);
        RuleFor(x => x.TechnicianCommissionValue).GreaterThanOrEqualTo(0);
    }

    private static bool BeValidCommissionType(string type) =>
        type == "Flat" || type == "Percentage";
}