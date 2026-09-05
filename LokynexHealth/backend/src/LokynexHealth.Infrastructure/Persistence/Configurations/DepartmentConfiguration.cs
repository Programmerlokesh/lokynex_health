using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class DepartmentConfiguration : IEntityTypeConfiguration<Department>
{
    public void Configure(EntityTypeBuilder<Department> builder)
    {
        builder.ToTable("departments");

        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Ignore(d => d.UpdatedAt);

        builder.Property(d => d.Name).HasMaxLength(150).IsRequired();
        builder.HasIndex(d => d.Name).IsUnique();

        builder.Property(d => d.Status)
            .HasColumnType("record_status")
            .HasDefaultValue(Domain.Enums.RecordStatus.Active);

        builder.HasMany(d => d.Tests)
            .WithOne(t => t.Department)
            .HasForeignKey(t => t.DepartmentId);
    }
}