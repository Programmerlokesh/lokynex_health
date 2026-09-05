using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class TestConfiguration : IEntityTypeConfiguration<Test>
{
    public void Configure(EntityTypeBuilder<Test> builder)
    {
        builder.ToTable("tests");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(t => t.Name).HasMaxLength(200).IsRequired();
        builder.Property(t => t.Price).HasColumnType("numeric(10,2)").IsRequired();

        builder.Property(t => t.DoctorCommissionType).HasColumnType("commission_type");
        builder.Property(t => t.DoctorCommissionValue).HasColumnType("numeric(10,2)");

        builder.Property(t => t.ReferralCommissionType).HasColumnType("commission_type");
        builder.Property(t => t.ReferralCommissionValue).HasColumnType("numeric(10,2)");

        builder.Property(t => t.TechnicianCommissionType).HasColumnType("commission_type");
        builder.Property(t => t.TechnicianCommissionValue).HasColumnType("numeric(10,2)");

        builder.Property(t => t.Status)
            .HasColumnType("record_status")
            .HasDefaultValue(Domain.Enums.RecordStatus.Active);

        builder.HasIndex(t => new { t.DepartmentId, t.Name }).IsUnique();
    }
}