using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

// All clinic tables live in the "platform" schema and are scoped by clinic_id.
// Column names come from the snake_case naming convention registered in Program.cs.

public class ClinicConfiguration : IEntityTypeConfiguration<Clinic>
{
    public void Configure(EntityTypeBuilder<Clinic> b)
    {
        b.ToTable("clinics", "platform");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
        b.Property(x => x.ClinicCode).HasMaxLength(20).IsRequired();
        b.HasIndex(x => x.ClinicCode).IsUnique();
        b.Property(x => x.Name).HasMaxLength(150).IsRequired();
        b.Property(x => x.Tagline).HasMaxLength(200);
        b.Property(x => x.Phone).HasMaxLength(20).IsRequired();
        b.Property(x => x.Email).HasMaxLength(150).IsRequired();
        b.Property(x => x.Pincode).HasMaxLength(10).IsRequired();
        b.Property(x => x.RegistrationNo).HasMaxLength(60);
        b.Property(x => x.FooterNote).HasMaxLength(300);
        b.Property(x => x.AccentColor).HasMaxLength(9).IsRequired();
        b.Property(x => x.AdminName).HasMaxLength(150).IsRequired();
        b.Property(x => x.AdminPhone).HasMaxLength(20).IsRequired();
        b.Property(x => x.AdminEmail).HasMaxLength(150).IsRequired();
        b.Property(x => x.AdminUsername).HasMaxLength(100).IsRequired();
        b.HasIndex(x => x.AdminUsername).IsUnique();
        b.Property(x => x.AdminPasswordHash).HasMaxLength(255).IsRequired();
        b.Property(x => x.Status).HasMaxLength(20).IsRequired();
        b.Property(x => x.CreatedByName).HasMaxLength(150);
    }
}

public class ClinicUserConfiguration : IEntityTypeConfiguration<ClinicUser>
{
    public void Configure(EntityTypeBuilder<ClinicUser> b)
    {
        b.ToTable("clinic_users", "platform");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
        b.Property(x => x.Name).HasMaxLength(150).IsRequired();
        b.Property(x => x.Username).HasMaxLength(100).IsRequired();
        b.HasIndex(x => x.Username).IsUnique();
        b.Property(x => x.Email).HasMaxLength(150);
        b.Property(x => x.Phone).HasMaxLength(20).IsRequired();
        b.Property(x => x.Role).HasMaxLength(40).IsRequired();
        b.Property(x => x.Permissions).HasMaxLength(1500).IsRequired();
        b.Property(x => x.PasswordHash).HasMaxLength(255).IsRequired();
        b.Property(x => x.Status).HasMaxLength(20).IsRequired();
        b.HasIndex(x => x.ClinicId);
    }
}

public class ClinicDoctorConfiguration : IEntityTypeConfiguration<ClinicDoctor>
{
    public void Configure(EntityTypeBuilder<ClinicDoctor> b)
    {
        b.ToTable("clinic_doctors", "platform");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
        b.Property(x => x.FullName).HasMaxLength(150).IsRequired();
        b.Property(x => x.Qualification).HasMaxLength(200);
        b.Property(x => x.Specialization).HasMaxLength(150);
        b.Property(x => x.RegistrationNo).HasMaxLength(60);
        b.Property(x => x.Phone).HasMaxLength(20);
        b.Property(x => x.Email).HasMaxLength(150);
        b.Property(x => x.Status).HasMaxLength(20).IsRequired();
        b.HasIndex(x => new { x.ClinicId, x.Status });
    }
}

public class ClinicScheduleConfiguration : IEntityTypeConfiguration<ClinicSchedule>
{
    public void Configure(EntityTypeBuilder<ClinicSchedule> b)
    {
        b.ToTable("clinic_schedules", "platform");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
        b.HasIndex(x => new { x.ClinicId, x.DoctorId, x.DayOfWeek });
    }
}

public class ClinicBookingConfiguration : IEntityTypeConfiguration<ClinicBooking>
{
    public void Configure(EntityTypeBuilder<ClinicBooking> b)
    {
        b.ToTable("clinic_bookings", "platform");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
        b.Property(x => x.PatientName).HasMaxLength(150).IsRequired();
        b.Property(x => x.PatientPhone).HasMaxLength(20).IsRequired();
        b.Property(x => x.PatientEmail).HasMaxLength(150);
        b.Property(x => x.PatientGender).HasMaxLength(10);
        b.Property(x => x.VisitFee).HasColumnType("numeric(10,2)");
        b.Property(x => x.PaymentMethod).HasMaxLength(20);
        b.Property(x => x.Status).HasMaxLength(20).IsRequired();
        b.HasIndex(x => new { x.ClinicId, x.BookingDate, x.DoctorId });
        b.HasIndex(x => new { x.ClinicId, x.DoctorId, x.BookingDate, x.SerialNo }).IsUnique();
    }
}

public class ClinicPatientConfiguration : IEntityTypeConfiguration<ClinicPatient>
{
    public void Configure(EntityTypeBuilder<ClinicPatient> b)
    {
        b.ToTable("clinic_patients", "platform");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
        b.Property(x => x.Name).HasMaxLength(150).IsRequired();
        b.Property(x => x.Gender).HasMaxLength(10);
        b.Property(x => x.Phone).HasMaxLength(20).IsRequired();
        b.Property(x => x.WhatsappNumber).HasMaxLength(20);
        b.Property(x => x.Email).HasMaxLength(150);
        b.Property(x => x.Pincode).HasMaxLength(10);
        b.HasIndex(x => new { x.ClinicId, x.Phone });
    }
}

public class ClinicMedicineConfiguration : IEntityTypeConfiguration<ClinicMedicine>
{
    public void Configure(EntityTypeBuilder<ClinicMedicine> b)
    {
        b.ToTable("clinic_medicines", "platform");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
        b.Property(x => x.BrandName).HasMaxLength(200).IsRequired();
        b.Property(x => x.Company).HasMaxLength(150).IsRequired();
        b.Property(x => x.Composition).HasMaxLength(500);
        b.Property(x => x.Form).HasMaxLength(40);
        b.Property(x => x.DefaultDosage).HasMaxLength(80);
        b.Property(x => x.DefaultDuration).HasMaxLength(80);
        b.Property(x => x.DefaultInstructions).HasMaxLength(200);
        b.Property(x => x.Source).HasMaxLength(20).IsRequired();
        b.HasIndex(x => new { x.ClinicId, x.Company });
    }
}

public class ClinicPrescriptionConfiguration : IEntityTypeConfiguration<ClinicPrescription>
{
    public void Configure(EntityTypeBuilder<ClinicPrescription> b)
    {
        b.ToTable("clinic_prescriptions", "platform");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
        b.Property(x => x.RxNo).HasMaxLength(30).IsRequired();
        b.Property(x => x.DoctorName).HasMaxLength(150).IsRequired();
        b.Property(x => x.DoctorQualification).HasMaxLength(200);
        b.Property(x => x.DoctorSpecialization).HasMaxLength(150);
        b.Property(x => x.DoctorRegNo).HasMaxLength(60);
        b.Property(x => x.PatientName).HasMaxLength(150).IsRequired();
        b.Property(x => x.PatientGender).HasMaxLength(10);
        b.Property(x => x.PatientPhone).HasMaxLength(20).IsRequired();
        b.Property(x => x.PatientWhatsapp).HasMaxLength(20);
        b.Property(x => x.PatientEmail).HasMaxLength(150);
        b.Property(x => x.PatientPincode).HasMaxLength(10);
        b.Property(x => x.Referral).HasMaxLength(200);
        b.Property(x => x.Bp).HasMaxLength(20);
        b.Property(x => x.Pulse).HasMaxLength(20);
        b.Property(x => x.Temperature).HasMaxLength(20);
        b.Property(x => x.Weight).HasMaxLength(20);
        b.Property(x => x.Spo2).HasMaxLength(20);
        b.Property(x => x.FollowUpNote).HasMaxLength(300);
        b.HasIndex(x => new { x.ClinicId, x.RxSerial }).IsUnique();
        b.HasIndex(x => new { x.ClinicId, x.VisitDate });
        b.HasIndex(x => x.PatientId);

        b.HasMany(x => x.Items).WithOne().HasForeignKey(i => i.PrescriptionId).OnDelete(DeleteBehavior.Cascade);
        b.HasMany(x => x.Tests).WithOne().HasForeignKey(t => t.PrescriptionId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class ClinicPrescriptionItemConfiguration : IEntityTypeConfiguration<ClinicPrescriptionItem>
{
    public void Configure(EntityTypeBuilder<ClinicPrescriptionItem> b)
    {
        b.ToTable("clinic_prescription_items", "platform");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
        b.Property(x => x.Name).HasMaxLength(200).IsRequired();
        b.Property(x => x.Company).HasMaxLength(150);
        b.Property(x => x.Composition).HasMaxLength(500);
        b.Property(x => x.Form).HasMaxLength(40);
        b.Property(x => x.Dosage).HasMaxLength(80);
        b.Property(x => x.Duration).HasMaxLength(80);
        b.Property(x => x.Instructions).HasMaxLength(200);
    }
}

public class ClinicPrescriptionTestConfiguration : IEntityTypeConfiguration<ClinicPrescriptionTest>
{
    public void Configure(EntityTypeBuilder<ClinicPrescriptionTest> b)
    {
        b.ToTable("clinic_prescription_tests", "platform");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
        b.Property(x => x.Name).HasMaxLength(200).IsRequired();
        b.Property(x => x.DepartmentName).HasMaxLength(150);
        b.Property(x => x.Note).HasMaxLength(200);
    }
}

public class ClinicLedgerEntryConfiguration : IEntityTypeConfiguration<ClinicLedgerEntry>
{
    public void Configure(EntityTypeBuilder<ClinicLedgerEntry> b)
    {
        b.ToTable("clinic_ledger_entries", "platform");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
        b.Property(x => x.EntryType).HasMaxLength(20).IsRequired();
        b.Property(x => x.Category).HasMaxLength(60);
        b.Property(x => x.Amount).HasColumnType("numeric(12,2)");
        b.Property(x => x.PaymentMethod).HasMaxLength(30);
        b.Property(x => x.ReferenceNo).HasMaxLength(60);
        b.Property(x => x.Description).HasMaxLength(500);
        b.Property(x => x.Source).HasMaxLength(20).IsRequired();
        b.HasIndex(x => new { x.ClinicId, x.EntryDate });
        b.HasIndex(x => x.ReferenceId);
    }
}