using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class DoctorClinicScheduleConfiguration : IEntityTypeConfiguration<DoctorClinicSchedule>
{
    public void Configure(EntityTypeBuilder<DoctorClinicSchedule> builder)
    {
        builder.ToTable("doctor_clinic_schedules");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.HasOne(s => s.Branch).WithMany().HasForeignKey(s => s.BranchId);

        builder.HasIndex(s => new { s.BranchId, s.DoctorId, s.DayOfWeek });
    }
}