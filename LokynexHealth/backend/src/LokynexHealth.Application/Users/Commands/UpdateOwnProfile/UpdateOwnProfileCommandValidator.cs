using FluentValidation;

namespace LokynexHealth.Application.Users.Commands.UpdateOwnProfile;

public class UpdateOwnProfileCommandValidator : AbstractValidator<UpdateOwnProfileCommand>
{
    public UpdateOwnProfileCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Pincode).MaximumLength(10);
    }
}