using FluentValidation;
using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Application.DoctorClinic.Commands.BookAppointment;

public class BookAppointmentCommandValidator : AbstractValidator<BookAppointmentCommand>
{
    public BookAppointmentCommandValidator()
    {
        RuleFor(x => x.DoctorId).NotEmpty();
        RuleFor(x => x.BranchId).NotEmpty();
        RuleFor(x => x.PatientName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.PatientPhone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Note).MaximumLength(1000);

        RuleFor(x => x.VisitFee).InclusiveBetween(0m, 1_000_000m)
            .WithMessage("Visit fee must be between 0 and 1,000,000.");
        RuleFor(x => x.PaymentMethod).NotEmpty()
            .When(x => x.VisitFee > 0)
            .WithMessage("Select a payment method for the visit fee.");
        RuleFor(x => x.PaymentMethod)
            .Must(m => Enum.TryParse<PaymentMethodType>(m, ignoreCase: true, out var pm) && Enum.IsDefined(pm))
            .When(x => !string.IsNullOrWhiteSpace(x.PaymentMethod))
            .WithMessage("Payment method must be Cash, Card or UPI.");
    }
}