using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

/// <summary>platform.doctors — the shared registry. Used only to CREATE doctors.</summary>
public class GlobalDoctorConfiguration : IEntityTypeConfiguration<GlobalDoctor>
{
    public void Configure(EntityTypeBuilder<GlobalDoctor> builder)
    {
        builder.ToTable("doctors", "platform");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(d => d.FullName).HasMaxLength(150).IsRequired();
        builder.Property(d => d.Phone).HasMaxLength(20).IsRequired();
        builder.Property(d => d.WhatsappNumber).HasMaxLength(20);
        builder.Property(d => d.Status).HasDefaultValue(PlatformRecordStatus.Active);
    }
}

/// <summary>platform.referrals — the shared registry. Used only to CREATE referrals.</summary>
public class GlobalReferralConfiguration : IEntityTypeConfiguration<GlobalReferral>
{
    public void Configure(EntityTypeBuilder<GlobalReferral> builder)
    {
        builder.ToTable("referrals", "platform");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(r => r.FullName).HasMaxLength(150).IsRequired();
        builder.Property(r => r.Phone).HasMaxLength(20).IsRequired();
        builder.Property(r => r.WhatsappNumber).HasMaxLength(20);
        builder.Property(r => r.Status).HasDefaultValue(PlatformRecordStatus.Active);
    }
}

/// <summary>doctor_lab_overrides — per-lab edits / status / hide of a global doctor.</summary>
public class DoctorLabOverrideConfiguration : IEntityTypeConfiguration<DoctorLabOverride>
{
    public void Configure(EntityTypeBuilder<DoctorLabOverride> builder)
    {
        builder.ToTable("doctor_lab_overrides");
        builder.HasKey(o => o.DoctorId);
        builder.Property(o => o.DoctorId).ValueGeneratedNever();
        builder.Property(o => o.FullName).HasMaxLength(150);
        builder.Property(o => o.Phone).HasMaxLength(20);
        builder.Property(o => o.WhatsappNumber).HasMaxLength(20);
        builder.Property(o => o.Specialization).HasMaxLength(150);
    }
}

/// <summary>referral_lab_overrides — per-lab edits / status / hide of a global referral.</summary>
public class ReferralLabOverrideConfiguration : IEntityTypeConfiguration<ReferralLabOverride>
{
    public void Configure(EntityTypeBuilder<ReferralLabOverride> builder)
    {
        builder.ToTable("referral_lab_overrides");
        builder.HasKey(o => o.ReferralId);
        builder.Property(o => o.ReferralId).ValueGeneratedNever();
        builder.Property(o => o.FullName).HasMaxLength(150);
        builder.Property(o => o.Phone).HasMaxLength(20);
        builder.Property(o => o.WhatsappNumber).HasMaxLength(20);
    }
}