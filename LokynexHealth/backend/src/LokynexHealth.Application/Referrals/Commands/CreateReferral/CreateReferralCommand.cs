using MediatR;

namespace LokynexHealth.Application.Referrals.Commands.CreateReferral;

public class CreateReferralCommand : IRequest<Guid>
{
    public string FullName { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? Email { get; set; }
    public string? Address { get; set; }
}