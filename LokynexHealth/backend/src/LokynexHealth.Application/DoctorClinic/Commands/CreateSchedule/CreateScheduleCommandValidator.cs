using FluentValidation;

namespace LokynexHealth.Application.DoctorClinic.Commands.CreateSchedule;

public class CreateScheduleCommandValidator : AbstractValidator<CreateScheduleCommand>
{
    public CreateScheduleCommandValidator()
    {
        RuleFor(x => x.BranchId).NotEmpty();
        RuleFor(x => x.DoctorId).NotEmpty();
        RuleFor(x => x.DayOfWeek).InclusiveBetween((short)0, (short)6);
        RuleFor(x => x.SlotMinutes).GreaterThan(0);
        RuleFor(x => x.MaxPatients).GreaterThan(0);
        RuleFor(x => x).Must(x => x.TimeTo > x.TimeFrom)
            .WithMessage("TimeTo must be after TimeFrom.");
    }
}