using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class BranchConfiguration : IEntityTypeConfiguration<Branch>
{
    public void Configure(EntityTypeBuilder<Branch> builder)
    {
        builder.ToTable("branches");

        builder.HasKey(b => b.Id);
        builder.Property(b => b.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(b => b.BranchName).HasMaxLength(150).IsRequired();
        builder.Property(b => b.BranchCode).HasMaxLength(20).IsRequired();
        builder.HasIndex(b => b.BranchCode).IsUnique();

        builder.Property(b => b.BranchAddress);
        builder.Property(b => b.BranchPincode).HasMaxLength(10);
        builder.Property(b => b.BranchPhone).HasMaxLength(20);
        builder.Property(b => b.BranchEmail);

        builder.Property(b => b.Status)
            .HasConversion<string>()
            .HasColumnType("record_status")
            .HasDefaultValue(Domain.Enums.RecordStatus.Active);

        builder.HasMany(b => b.Users)
            .WithOne(u => u.Branch)
            .HasForeignKey(u => u.BranchId);
    }
}