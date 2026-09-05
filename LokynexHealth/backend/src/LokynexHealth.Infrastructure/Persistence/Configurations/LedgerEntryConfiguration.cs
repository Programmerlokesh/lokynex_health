using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class LedgerEntryConfiguration : IEntityTypeConfiguration<LedgerEntry>
{
    public void Configure(EntityTypeBuilder<LedgerEntry> builder)
    {
        builder.ToTable("ledger_entries");
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(l => l.EntryType).HasMaxLength(30).IsRequired();
        builder.Property(l => l.ReferenceTable).HasMaxLength(50);
        builder.Property(l => l.Amount).HasColumnType("numeric(12,2)");

        builder.HasIndex(l => new { l.BranchId, l.EntryDate });   // matches idx_ledger_entries_branch_date in schema
    }
}