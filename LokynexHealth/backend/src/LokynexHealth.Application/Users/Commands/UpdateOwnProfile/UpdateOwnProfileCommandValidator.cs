using FluentValidation;

namespace LokynexHealth.Application.Users.Commands.UpdateOwnProfile;

public class UpdateOwnProfileCommandValidator : AbstractValidator<UpdateOwnProfileCommand>
{
    // The profile page uploads a photo as a small (256x256 JPEG) base64 data
    // URL, which is ~20-60 KB. 400k chars is a generous hard ceiling.
    private const int MaxPhotoLength = 400_000;

    public UpdateOwnProfileCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Pincode).MaximumLength(10);

        RuleFor(x => x.ProfilePictureUrl)
            .MaximumLength(MaxPhotoLength)
            .WithMessage("Profile photo is too large. Please choose a smaller image.")
            .Must(v => v!.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase)
                    || v.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
                    || v.StartsWith("http://", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Profile photo must be an uploaded image.")
            .When(x => !string.IsNullOrWhiteSpace(x.ProfilePictureUrl));
    }
}