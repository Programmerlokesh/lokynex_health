using FluentValidation;
using LokynexHealth.Application.Common;

namespace LokynexHealth.Application.Referrals.Commands.CreateReferral;

public class CreateReferralCommandValidator : AbstractValidator<CreateReferralCommand>
{
    public CreateReferralCommandValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Phone)
            .NotEmpty()
            .Must(p => PhoneNormalizer.ToIndianMobile(p) is not null)
            .WithMessage("Enter a valid 10-digit Indian mobile number (starts with 6, 7, 8 or 9).");
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
    }
}