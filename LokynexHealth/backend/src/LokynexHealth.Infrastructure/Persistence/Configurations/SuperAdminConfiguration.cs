using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class SuperAdminConfiguration : IEntityTypeConfiguration<SuperAdmin>
{
    public void Configure(EntityTypeBuilder<SuperAdmin> builder)
    {
        builder.ToTable("super_admins", "platform");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(s => s.Email).IsRequired();
        builder.HasIndex(s => s.Email).IsUnique();
        builder.Property(s => s.Username).HasMaxLength(100).IsRequired();
        builder.HasIndex(s => s.Username).IsUnique();
        builder.Property(s => s.Status).HasColumnType("platform.record_status").HasDefaultValue(Domain.Enums.PlatformRecordStatus.Active);
    }
}