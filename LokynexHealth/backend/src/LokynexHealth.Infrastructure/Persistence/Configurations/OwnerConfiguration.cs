using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class OwnerConfiguration : IEntityTypeConfiguration<Owner>
{
    public void Configure(EntityTypeBuilder<Owner> builder)
    {
        builder.ToTable("owners", "platform");
        builder.HasKey(o => o.Id);
        builder.Property(o => o.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(o => o.Name).HasMaxLength(150).IsRequired();
        builder.Property(o => o.Role).HasMaxLength(50).IsRequired();
        builder.Property(o => o.Username).HasMaxLength(100).IsRequired();
        builder.HasIndex(o => o.Username).IsUnique();
        builder.Property(o => o.Phone).HasMaxLength(20).IsRequired();
        builder.Property(o => o.WhatsappNumber).HasMaxLength(20);
        builder.Property(o => o.Pincode).HasMaxLength(10);
        builder.Property(o => o.Permissions).HasMaxLength(500).IsRequired();
        builder.Property(o => o.Status).HasColumnType("platform.record_status")
            .HasDefaultValue(Domain.Enums.PlatformRecordStatus.Active);
    }
}

public class OwnerLedgerEntryConfiguration : IEntityTypeConfiguration<OwnerLedgerEntry>
{
    public void Configure(EntityTypeBuilder<OwnerLedgerEntry> builder)
    {
        builder.ToTable("owner_ledger_entries", "platform");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(e => e.EntryType).HasMaxLength(30).IsRequired();
        builder.Property(e => e.Category).HasMaxLength(60);
        builder.Property(e => e.Amount).HasColumnType("numeric(12,2)");
        builder.Property(e => e.PaymentMethod).HasMaxLength(30);
        builder.Property(e => e.ReferenceNo).HasMaxLength(60);
        builder.Property(e => e.Description).HasMaxLength(500);
        builder.HasIndex(e => new { e.OwnerId, e.EntryDate });
    }
}