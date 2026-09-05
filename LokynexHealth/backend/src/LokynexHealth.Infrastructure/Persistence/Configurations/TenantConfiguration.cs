using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.ToTable("tenants", "platform");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(t => t.LabCode).HasMaxLength(20).IsRequired();
        builder.HasIndex(t => t.LabCode).IsUnique();

        builder.Property(t => t.SchemaName).HasMaxLength(63).IsRequired();
        builder.HasIndex(t => t.SchemaName).IsUnique();

        builder.Property(t => t.Subdomain).HasMaxLength(100).IsRequired();
        builder.HasIndex(t => t.Subdomain).IsUnique();

        builder.Property(t => t.AdminUsername).HasMaxLength(100).IsRequired();
        builder.HasIndex(t => t.AdminUsername).IsUnique();

        builder.Property(t => t.Status).HasColumnType("platform.record_status").HasDefaultValue(Domain.Enums.PlatformRecordStatus.Active);

        builder.HasMany(t => t.ExtendBranches).WithOne(b => b.Tenant).HasForeignKey(b => b.TenantId);
    }
}