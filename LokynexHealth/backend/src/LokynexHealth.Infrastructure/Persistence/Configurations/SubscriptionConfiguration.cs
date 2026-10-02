using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class SubscriptionConfiguration : IEntityTypeConfiguration<Subscription>
{
    public void Configure(EntityTypeBuilder<Subscription> builder)
    {
        builder.ToTable("subscriptions", "platform");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(s => s.AmountPaid).HasColumnType("numeric(10,2)");
        builder.Property(s => s.Status).HasColumnType("platform.subscription_status").HasDefaultValue(Domain.Enums.SubscriptionStatusType.Active);

        builder.HasIndex(s => s.TenantId);

        // Composite index: this is how a branch's own subscription list and
        // the lab's main-subscription lookup (BranchId IS NULL) both stay
        // index-backed lookups instead of a table scan.
        builder.HasIndex(s => new { s.TenantId, s.BranchId });

        builder.HasOne<TenantBranch>()
            .WithMany()
            .HasForeignKey(s => s.BranchId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}