using FluentValidation;

namespace LokynexHealth.Application.Labs.Commands.CreateLab;

public class CreateLabCommandValidator : AbstractValidator<CreateLabCommand>
{
    public CreateLabCommandValidator()
        {
                RuleFor(x => x.PrimaryBranchName).NotEmpty().MaximumLength(150);
                        RuleFor(x => x.PrimaryBranchAddress).NotEmpty();
                                RuleFor(x => x.PrimaryBranchPhone).NotEmpty().MaximumLength(20);
                                        RuleFor(x => x.PrimaryBranchEmail).NotEmpty().EmailAddress();
                                                RuleFor(x => x.PrimaryBranchPincode).NotEmpty().MaximumLength(10);

                                                        RuleFor(x => x.AdminName).NotEmpty().MaximumLength(150);
                                                                RuleFor(x => x.AdminPhone).NotEmpty().MaximumLength(20);
                                                                        RuleFor(x => x.AdminEmail).NotEmpty().EmailAddress();
                                                                                RuleFor(x => x.AdminUsername).NotEmpty().MaximumLength(100);
                                                                                        RuleFor(x => x.AdminPassword).NotEmpty().MinimumLength(8);
                                                                                                RuleFor(x => x.UserLimit).GreaterThan(0);

                                                                                                        RuleForEach(x => x.ExtendBranches).ChildRules(b =>
                                                                                                                {
                                                                                                                            b.RuleFor(y => y.BranchName).NotEmpty().MaximumLength(150);
                                                                                                                                        b.RuleFor(y => y.BranchCode).NotEmpty().MaximumLength(20);
                                                                                                                                                    b.RuleFor(y => y.BranchPhone).MaximumLength(20);
                                                                                                                                                                b.RuleFor(y => y.BranchPincode).MaximumLength(10);
                                                                                                                                                                        });

                                                                                                                                                                                RuleFor(x => x.ExtendBranches)
                                                                                                                                                                                            .Must(list => list
                                                                                                                                                                                                            .Select(b => (b.BranchCode ?? "").Trim().ToUpperInvariant())
                                                                                                                                                                                                                            .Distinct()
                                                                                                                                                                                                                                            .Count() == list.Count)
                                                                                                                                                                                                                                                        .WithMessage("Additional branch codes must be unique.");
                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                            }