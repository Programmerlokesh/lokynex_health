using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

/// <summary>Doctor = this lab's effective view (tenant view "doctors_effective"), read-only.</summary>
public class DoctorConfiguration : IEntityTypeConfiguration<Doctor>
{
    public void Configure(EntityTypeBuilder<Doctor> builder)
    {
        builder.ToView("doctors_effective");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.FullName).HasMaxLength(150).IsRequired();
        builder.Property(d => d.Phone).HasMaxLength(20).IsRequired();
        builder.Property(d => d.WhatsappNumber).HasMaxLength(20);
    }
}