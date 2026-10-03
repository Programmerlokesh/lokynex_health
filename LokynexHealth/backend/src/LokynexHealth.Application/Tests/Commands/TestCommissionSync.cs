using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Tests.Commands;

public static class TestCommissionSync
{
    public static IRuleBuilderOptions<T, List<TestCommissionInput>> MustBeValidCommissions<T>(
        this IRuleBuilder<T, List<TestCommissionInput>> rule) =>
        rule
            .NotNull()
            .Must(list => (list ?? new()).All(c => c.EntityType is "Doctor" or "Referral" or "Technician"))
            .WithMessage("Commission person type must be Doctor, Referral or Technician.")
            .Must(list => (list ?? new()).All(c => c.EntityId != Guid.Empty))
            .WithMessage("Select a person for every commission row.")
            .Must(list => (list ?? new()).All(c => c.CommissionType is "Flat" or "Percentage"))
            .WithMessage("Commission type must be Flat or Percentage.")
            .Must(list => (list ?? new()).All(c => c.CommissionValue >= 0))
            .WithMessage("Commission value cannot be negative.")
            .Must(list => (list ?? new()).Select(c => (c.EntityType, c.EntityId)).Distinct().Count() == (list ?? new()).Count)
            .WithMessage("The same person is added twice for this test.");

    /// <summary>
    /// Makes the test's commission_overrides rows exactly match <paramref name="desired"/>
    /// (insert / update / delete). Caller saves.
    /// </summary>
    public static async Task SyncAsync(
        IApplicationDbContext db, Test test, List<TestCommissionInput> desired, CancellationToken ct)
    {
        // ---- validate that every person exists (one query per type) ----
        async Task Require(string type, IEnumerable<Guid> ids, Func<List<Guid>, Task<HashSet<Guid>>> fetch)
        {
            var list = ids.Distinct().ToList();
            if (list.Count == 0) return;
            var found = await fetch(list);
            var missing = list.FirstOrDefault(id => !found.Contains(id));
            if (missing != Guid.Empty) throw new NotFoundException(type, missing);
        }

        await Require("Doctor", desired.Where(d => d.EntityType == "Doctor").Select(d => d.EntityId),
            async ids => (await db.Doctors.Where(x => ids.Contains(x.Id)).Select(x => x.Id).ToListAsync(ct)).ToHashSet());
        await Require("Referral", desired.Where(d => d.EntityType == "Referral").Select(d => d.EntityId),
            async ids => (await db.Referrals.Where(x => ids.Contains(x.Id)).Select(x => x.Id).ToListAsync(ct)).ToHashSet());
        await Require("Technician", desired.Where(d => d.EntityType == "Technician").Select(d => d.EntityId),
            async ids => (await db.Technicians.Where(x => ids.Contains(x.Id)).Select(x => x.Id).ToListAsync(ct)).ToHashSet());

        var existing = await db.CommissionOverrides.Where(c => c.TestId == test.Id).ToListAsync(ct);

        static (CommissionEntityType, Guid) KeyOf(CommissionOverride c) =>
            (c.EntityType, (c.DoctorId ?? c.ReferralId ?? c.TechnicianId)!.Value);

        var existingByKey = existing.ToDictionary(KeyOf);
        var desiredKeys = new HashSet<(CommissionEntityType, Guid)>();

        foreach (var d in desired)
        {
            var type = Enum.Parse<CommissionEntityType>(d.EntityType);
            var key = (type, d.EntityId);
            desiredKeys.Add(key);
            var commissionType = Enum.Parse<CommissionType>(d.CommissionType);

            if (existingByKey.TryGetValue(key, out var row))
            {
                row.CommissionType = commissionType;
                row.CommissionValue = d.CommissionValue;
                row.DepartmentId = test.DepartmentId;
            }
            else
            {
                db.CommissionOverrides.Add(new CommissionOverride
                {
                    Id = Guid.NewGuid(),
                    EntityType = type,
                    TestId = test.Id,
                    DepartmentId = test.DepartmentId,
                    CommissionType = commissionType,
                    CommissionValue = d.CommissionValue,
                    CreatedAt = DateTimeOffset.UtcNow,
                    DoctorId = type == CommissionEntityType.Doctor ? d.EntityId : null,
                    ReferralId = type == CommissionEntityType.Referral ? d.EntityId : null,
                    TechnicianId = type == CommissionEntityType.Technician ? d.EntityId : null
                });
            }
        }

        db.CommissionOverrides.RemoveRange(existing.Where(c => !desiredKeys.Contains(KeyOf(c))));
    }
}