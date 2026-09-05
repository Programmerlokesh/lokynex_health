using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class CommissionPayoutConfiguration : IEntityTypeConfiguration<CommissionPayout>
{
    public void Configure(EntityTypeBuilder<CommissionPayout> builder)
    {
        builder.ToTable("commission_payouts");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(c => c.EntityType).HasColumnType("commission_entity_type");
        builder.Property(c => c.CommissionAmount).HasColumnType("numeric(10,2)");
        builder.Property(c => c.Status).HasColumnType("commission_status_type").HasDefaultValue(Domain.Enums.CommissionStatusType.Unpaid);

        builder.HasOne(c => c.OrderItem).WithMany().HasForeignKey(c => c.OrderItemId);

        builder.HasIndex(c => c.DoctorId);
        builder.HasIndex(c => c.ReferralId);
        builder.HasIndex(c => c.TechnicianId);
        builder.HasIndex(c => c.Status);
        builder.HasIndex(c => c.OrderItemId);   // used heavily by the dedup lookup in Section 4
    }
}