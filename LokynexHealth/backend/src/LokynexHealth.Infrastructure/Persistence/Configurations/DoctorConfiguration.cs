using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class DoctorConfiguration : IEntityTypeConfiguration<Doctor>
{
    public void Configure(EntityTypeBuilder<Doctor> builder)
    {
        builder.ToTable("doctors", "platform");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(d => d.FullName).HasMaxLength(150).IsRequired();
        builder.Property(d => d.Phone).HasMaxLength(20).IsRequired();
        builder.Property(d => d.Status).HasColumnType("platform.record_status").HasDefaultValue(Domain.Enums.PlatformRecordStatus.Active);
    }
}