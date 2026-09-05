using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class CommissionOverrideConfiguration : IEntityTypeConfiguration<CommissionOverride>
{
    public void Configure(EntityTypeBuilder<CommissionOverride> builder)
    {
        builder.ToTable("commission_overrides");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(c => c.EntityType).HasColumnType("commission_entity_type");
        builder.Property(c => c.CommissionType).HasColumnType("commission_type");
        builder.Property(c => c.CommissionValue).HasColumnType("numeric(10,2)");

        builder.HasOne(c => c.Test).WithMany().HasForeignKey(c => c.TestId);

        // No navigation property for Doctor/Referral/Technician here —
        // we resolve those manually in the handler (Section 4) since exactly
        // one of the three FK columns is populated per row (DB CHECK enforces this).
        builder.HasIndex(c => new { c.DoctorId, c.TestId }).IsUnique().HasFilter("doctor_id IS NOT NULL");
        builder.HasIndex(c => new { c.ReferralId, c.TestId }).IsUnique().HasFilter("referral_id IS NOT NULL");
        builder.HasIndex(c => new { c.TechnicianId, c.TestId }).IsUnique().HasFilter("technician_id IS NOT NULL");
    }
}