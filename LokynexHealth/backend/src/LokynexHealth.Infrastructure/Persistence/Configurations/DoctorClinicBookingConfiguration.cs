using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class DoctorClinicBookingConfiguration : IEntityTypeConfiguration<DoctorClinicBooking>
{
    public void Configure(EntityTypeBuilder<DoctorClinicBooking> builder)
    {
        builder.ToTable("doctor_clinic_bookings");
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(b => b.Status).HasColumnType("booking_status_type").HasDefaultValue(Domain.Enums.BookingStatusType.Booked);
        builder.Property(b => b.PatientName).HasMaxLength(150).IsRequired();
        builder.Property(b => b.PatientPhone).HasMaxLength(20).IsRequired();

        builder.HasIndex(b => new { b.DoctorId, b.BookingDate });
        builder.HasIndex(b => new { b.BranchId, b.BookingDate });
    }
}