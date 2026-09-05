using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class PatientConfiguration : IEntityTypeConfiguration<Patient>
{
    public void Configure(EntityTypeBuilder<Patient> builder)
    {
        builder.ToTable("patients");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(p => p.PatientCode).HasMaxLength(30).IsRequired();
        builder.HasIndex(p => p.PatientCode).IsUnique();

        builder.Property(p => p.Phone).HasMaxLength(20).IsRequired();
        builder.HasIndex(p => p.Phone);   // schema er idx_patients_phone, dhonno search-by-phone

        builder.Property(p => p.Gender).HasColumnType("gender_type");
    }
}