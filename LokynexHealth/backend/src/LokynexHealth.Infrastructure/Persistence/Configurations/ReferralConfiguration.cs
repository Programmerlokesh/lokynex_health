using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

/// <summary>Referral = this lab's effective view (tenant view "referrals_effective"), read-only.</summary>
public class ReferralConfiguration : IEntityTypeConfiguration<Referral>
{
    public void Configure(EntityTypeBuilder<Referral> builder)
    {
        builder.ToView("referrals_effective");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.FullName).HasMaxLength(150).IsRequired();
        builder.Property(r => r.Phone).HasMaxLength(20).IsRequired();
        builder.Property(r => r.WhatsappNumber).HasMaxLength(20);
    }
}