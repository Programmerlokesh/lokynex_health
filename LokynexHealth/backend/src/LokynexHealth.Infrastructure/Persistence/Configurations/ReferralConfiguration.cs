using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class ReferralConfiguration : IEntityTypeConfiguration<Referral>
{
    public void Configure(EntityTypeBuilder<Referral> builder)
    {
        builder.ToTable("referrals", "platform");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(r => r.FullName).HasMaxLength(150).IsRequired();
        builder.Property(r => r.Phone).HasMaxLength(20).IsRequired();
        builder.Property(r => r.Status)
    .HasColumnType("platform.record_status")
    .HasDefaultValue(Domain.Enums.PlatformRecordStatus.Active); // <-- RecordStatus na, PlatformRecordStatus
    }
}