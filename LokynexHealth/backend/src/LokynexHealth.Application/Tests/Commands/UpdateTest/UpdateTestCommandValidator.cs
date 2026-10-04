using FluentValidation;

namespace LokynexHealth.Application.Tests.Commands.UpdateTest;

public class UpdateTestCommandValidator : AbstractValidator<UpdateTestCommand>
{
    public UpdateTestCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Status).Must(s => s is "Active" or "Inactive");

        RuleFor(x => x.DoctorCommissionType).Must(BeValidCommissionType);
        RuleFor(x => x.ReferralCommissionType).Must(BeValidCommissionType);
        RuleFor(x => x.TechnicianCommissionType).Must(BeValidCommissionType);

        RuleFor(x => x.DoctorCommissionValue).GreaterThanOrEqualTo(0);
        RuleFor(x => x.ReferralCommissionValue).GreaterThanOrEqualTo(0);
        RuleFor(x => x.TechnicianCommissionValue).GreaterThanOrEqualTo(0);

        RuleFor(x => x.Commissions).MustBeValidCommissions();
    }

    private static bool BeValidCommissionType(string type) => type is "Flat" or "Percentage";
}