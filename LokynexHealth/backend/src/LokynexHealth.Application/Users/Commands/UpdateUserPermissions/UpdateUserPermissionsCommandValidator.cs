using FluentValidation;

namespace LokynexHealth.Application.Users.Commands.UpdateUserPermissions;

public class UpdateUserPermissionsCommandValidator : AbstractValidator<UpdateUserPermissionsCommand>
{
    public UpdateUserPermissionsCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
    }
}