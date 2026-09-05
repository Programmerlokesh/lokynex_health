using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class PlanConfiguration : IEntityTypeConfiguration<Plan>
{
    public void Configure(EntityTypeBuilder<Plan> builder)
    {
        builder.ToTable("plans", "platform");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(p => p.Name).HasMaxLength(100).IsRequired();
        builder.Property(p => p.Price).HasColumnType("numeric(10,2)");
        builder.Property(p => p.BillingCycle).HasColumnType("platform.billing_cycle").HasDefaultValue(Domain.Enums.BillingCycleType.Monthly);
        builder.Property(p => p.FeaturesJson).HasColumnName("features").HasColumnType("jsonb");
    }
}