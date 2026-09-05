using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;

namespace LokynexHealth.Application.Referrals.Commands.CreateReferral;

public class CreateReferralCommandHandler : IRequestHandler<CreateReferralCommand, Guid>
{
    private readonly IApplicationDbContext _db;

    public CreateReferralCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Guid> Handle(CreateReferralCommand request, CancellationToken cancellationToken)
    {
        var referral = new Referral
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName,
            Phone = request.Phone,
            Email = request.Email,
            Address = request.Address,
            Status = PlatformRecordStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.Referrals.Add(referral);
        await _db.SaveChangesAsync(cancellationToken);

        return referral.Id;
    }
}