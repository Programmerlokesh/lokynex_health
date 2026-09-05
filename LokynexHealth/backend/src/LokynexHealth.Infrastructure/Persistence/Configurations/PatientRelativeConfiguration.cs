using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class PatientRelativeConfiguration : IEntityTypeConfiguration<PatientRelative>
{
    public void Configure(EntityTypeBuilder<PatientRelative> builder)
    {
        builder.ToTable("patient_relatives");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(r => r.Name).HasMaxLength(150).IsRequired();
        builder.Property(r => r.Gender).HasColumnType("gender_type");

        builder.HasOne(r => r.Patient).WithMany(p => p.Relatives).HasForeignKey(r => r.PatientId);
    }
}