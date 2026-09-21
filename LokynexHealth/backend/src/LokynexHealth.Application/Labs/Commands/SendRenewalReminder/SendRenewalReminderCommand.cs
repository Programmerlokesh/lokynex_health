using MediatR;

namespace LokynexHealth.Application.Labs.Commands.SendRenewalReminder;

public class SendRenewalReminderCommand : IRequest<Guid>
{
    public Guid LabId { get; set; }

    /// <summary>Optional override — left empty, a message is composed from the subscription.</summary>
    public string? Title { get; set; }
    public string? Message { get; set; }
}