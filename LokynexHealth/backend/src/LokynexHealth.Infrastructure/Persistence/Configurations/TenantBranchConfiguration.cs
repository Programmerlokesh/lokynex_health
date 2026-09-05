using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class TenantBranchConfiguration : IEntityTypeConfiguration<TenantBranch>
{
    public void Configure(EntityTypeBuilder<TenantBranch> builder)
    {
        builder.ToTable("tenant_branches", "platform");
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(b => b.BranchName).HasMaxLength(150).IsRequired();
        builder.Property(b => b.BranchCode).HasMaxLength(20).IsRequired();

        builder.HasIndex(b => new { b.TenantId, b.BranchCode }).IsUnique();
    }
}