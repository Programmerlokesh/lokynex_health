using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Labs.Common;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Labs.Commands.SendRenewalReminder;

public class SendRenewalReminderCommandHandler : IRequestHandler<SendRenewalReminderCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public SendRenewalReminderCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(SendRenewalReminderCommand request, CancellationToken cancellationToken)
    {
        var tenant = await _db.Tenants
            .FirstOrDefaultAsync(t => t.Id == request.LabId, cancellationToken);

        if (tenant is null)
            throw new NotFoundException("Lab", request.LabId);

        var subscriptions = await _db.Subscriptions
            .Where(s => s.TenantId == tenant.Id)
            .ToListAsync(cancellationToken);

        var planIds = subscriptions.Select(s => s.PlanId).Distinct().ToList();
        var planNames = await _db.Plans
            .Where(p => planIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p.Name, cancellationToken);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var summary = LabSubscriptionCalculator.Build(subscriptions, planNames, today);

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            // TenantId is the whole point of this feature: a renewal reminder is
            // addressed to ONE lab, so it must never be saved as null (broadcast).
            TenantId = tenant.Id,
            Title = string.IsNullOrWhiteSpace(request.Title)
                ? BuildTitle(summary)
                : request.Title!.Trim(),
            Message = string.IsNullOrWhiteSpace(request.Message)
                ? BuildMessage(tenant.PrimaryBranchName, summary)
                : request.Message!.Trim(),
            SentBy = _currentUser.UserId,
            IsRead = false,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync(cancellationToken);

        return notification.Id;
    }

    private static string BuildTitle(LabSubscriptionSummary? summary)
    {
        if (summary is null)
            return "Subscription required";

        return summary.IsExpired
            ? "Subscription expired — renewal required"
            : "Subscription expiring soon";
    }

    private static string BuildMessage(string labName, LabSubscriptionSummary? summary)
    {
        if (summary is null)
        {
            return $"{labName} does not have an active subscription on record. " +
                   "Please contact the Lokynex Health team to activate a plan.";
        }

        var endDate = summary.EndDate.ToString("dd MMM yyyy");

        if (summary.IsExpired)
        {
            var daysLapsed = Math.Abs(summary.DaysRemaining);
            var dayWord = daysLapsed == 1 ? "day" : "days";
            return $"The '{summary.PlanName}' subscription for {labName} expired on {endDate} " +
                   $"({daysLapsed} {dayWord} ago). Please renew to avoid interruption of service.";
        }

        var daysLeftWord = summary.DaysRemaining == 1 ? "day" : "days";
        return $"The '{summary.PlanName}' subscription for {labName} expires on {endDate} " +
               $"({summary.DaysRemaining} {daysLeftWord} remaining). Please renew before that date.";
    }
}