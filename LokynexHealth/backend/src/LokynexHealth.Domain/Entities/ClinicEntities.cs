namespace LokynexHealth.Domain.Entities;

/// <summary>Plain string statuses (no Postgres enum) keep the clinic tables independent of the lab enum mapping.</summary>
public static class ClinicStatus
{
    public const string Active = "Active";
    public const string Inactive = "Inactive";
    public const string Suspended = "Suspended";
}

public static class BookingStatus
{
    public const string Booked = "Booked";
    public const string Cancelled = "Cancelled";
    public const string Completed = "Completed";
}

/// <summary>A doctor's clinic account. Created by the SuperAdmin (like a lab / Tenant).
/// The admin login lives on this row; every other clinic table points here with clinic_id.</summary>
public class Clinic : BaseEntity
{
    public string ClinicCode { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string? Tagline { get; set; }
    public string Address { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string Pincode { get; set; } = default!;
    public string? RegistrationNo { get; set; }

    /// <summary>JSON: prescription layout (default / personal pad with header+footer / custom). Images are data URLs.</summary>
    public string? RxLayout { get; set; }

    /// <summary>Small compressed image stored as a data URL (printed on the prescription).</summary>
    public string? LogoUrl { get; set; }
    public string? FooterNote { get; set; }
    public string AccentColor { get; set; } = "#0E7C86";

    public string AdminName { get; set; } = default!;
    public string AdminPhone { get; set; } = default!;
    public string? AdminAddress { get; set; }
    public string AdminEmail { get; set; } = default!;
    public string AdminUsername { get; set; } = default!;
    public string AdminPasswordHash { get; set; } = default!;

    public int UserLimit { get; set; } = 5;
    public string Status { get; set; } = ClinicStatus.Active;
    public Guid? CreatedBy { get; set; }
    public string? CreatedByName { get; set; }
}

public class ClinicUser : BaseEntity
{
    public Guid ClinicId { get; set; }
    public string Name { get; set; } = default!;
    public string Username { get; set; } = default!;
    public string? Email { get; set; }
    public string Phone { get; set; } = default!;
    public string Role { get; set; } = default!;

    /// <summary>"appointments:view,appointments:create,..." — see ClinicPermissions.</summary>
    public string Permissions { get; set; } = "";
    public string PasswordHash { get; set; } = default!;
    public string Status { get; set; } = ClinicStatus.Active;
    public Guid? CreatedBy { get; set; }
}

public class ClinicDoctor : BaseEntity
{
    public Guid ClinicId { get; set; }
    public string FullName { get; set; } = default!;
    public string? Qualification { get; set; }
    public string? Specialization { get; set; }
    public string? RegistrationNo { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string Status { get; set; } = ClinicStatus.Active;
}

public class ClinicSchedule : BaseEntity
{
    public Guid ClinicId { get; set; }
    public Guid DoctorId { get; set; }
    public short DayOfWeek { get; set; }          // 0 = Sunday ... 6 = Saturday
    public int SlotMinutes { get; set; }
    public TimeOnly TimeFrom { get; set; }
    public TimeOnly TimeTo { get; set; }
    public int MaxPatients { get; set; }
    public bool IsActive { get; set; } = true;
}

public class ClinicBooking : BaseEntity
{
    public Guid ClinicId { get; set; }
    public Guid? ScheduleId { get; set; }
    public Guid DoctorId { get; set; }
    public DateOnly BookingDate { get; set; }
    public TimeOnly TimeSlot { get; set; }

    /// <summary>1, 2, 3 ... per (doctor, date). Never reused, even after a cancellation.</summary>
    public int SerialNo { get; set; }

    public string PatientName { get; set; } = default!;
    public string PatientPhone { get; set; } = default!;
    public string? PatientEmail { get; set; }
    public int? PatientAge { get; set; }
    public string? PatientGender { get; set; }
    public string? Note { get; set; }
    public decimal VisitFee { get; set; }
    public string? PaymentMethod { get; set; }
    public string Status { get; set; } = BookingStatus.Booked;
    public Guid? PrescriptionId { get; set; }
    public Guid? CreatedBy { get; set; }
}

public class ClinicPatient : BaseEntity
{
    public Guid ClinicId { get; set; }
    public string Name { get; set; } = default!;
    public int? Age { get; set; }
    public string? Gender { get; set; }
    public string Phone { get; set; } = default!;
    public string? WhatsappNumber { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? Pincode { get; set; }
    public DateTimeOffset? LastVisitAt { get; set; }
}

public class ClinicMedicine : BaseEntity
{
    public Guid ClinicId { get; set; }
    public string BrandName { get; set; } = default!;
    public string Company { get; set; } = "";
    public string? Composition { get; set; }
    public string? Form { get; set; }
    public string? DefaultDosage { get; set; }
    public string? DefaultDuration { get; set; }
    public string? DefaultInstructions { get; set; }

    /// <summary>Manual | Import | Auto (learned from a saved prescription)</summary>
    public string Source { get; set; } = "Manual";
    public int UsageCount { get; set; }
    public bool IsActive { get; set; } = true;
}

public class ClinicPrescription : BaseEntity
{
    public Guid ClinicId { get; set; }
    public int RxSerial { get; set; }
    public string RxNo { get; set; } = default!;
    public DateOnly VisitDate { get; set; }

    public Guid? DoctorId { get; set; }
    // Doctor details are copied onto the prescription so an old prescription
    // never changes when the doctor's profile is edited later.
    public string DoctorName { get; set; } = default!;
    public string? DoctorQualification { get; set; }
    public string? DoctorSpecialization { get; set; }
    public string? DoctorRegNo { get; set; }

    public Guid? PatientId { get; set; }
    public string PatientName { get; set; } = default!;
    public int? PatientAge { get; set; }
    public string? PatientGender { get; set; }
    public string PatientPhone { get; set; } = default!;
    public string? PatientWhatsapp { get; set; }
    public string? PatientEmail { get; set; }
    public string? PatientAddress { get; set; }
    public string? PatientPincode { get; set; }

    public Guid? BookingId { get; set; }
    public string? Referral { get; set; }
    public string? ChiefComplaints { get; set; }
    public string? Diagnosis { get; set; }
    public string? Bp { get; set; }
    public string? Pulse { get; set; }
    public string? Temperature { get; set; }
    public string? Weight { get; set; }
    public string? Spo2 { get; set; }
    public string? GeneralAdvice { get; set; }
    public DateOnly? FollowUpDate { get; set; }
    public string? FollowUpNote { get; set; }
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    public List<ClinicPrescriptionItem> Items { get; set; } = new();
    public List<ClinicPrescriptionTest> Tests { get; set; } = new();
}

public class ClinicPrescriptionItem : BaseEntity
{
    public Guid PrescriptionId { get; set; }
    public int SortOrder { get; set; }
    public Guid? MedicineId { get; set; }
    public string Name { get; set; } = default!;
    public string? Company { get; set; }
    public string? Composition { get; set; }
    public string? Form { get; set; }
    public string? Dosage { get; set; }
    public string? Duration { get; set; }
    public string? Instructions { get; set; }
}

public class ClinicPrescriptionTest : BaseEntity
{
    public Guid PrescriptionId { get; set; }
    public int SortOrder { get; set; }
    public Guid? TestId { get; set; }
    public string Name { get; set; } = default!;
    public string? DepartmentName { get; set; }
    public string? Note { get; set; }
}

/// <summary>Amount is ALWAYS positive; EntryType (Income | Expense | Refund) decides the sign.
/// Source = Manual (editable) | Booking | BookingRefund (automatic, read-only).</summary>
public class ClinicLedgerEntry : BaseEntity
{
    public Guid ClinicId { get; set; }
    public DateOnly EntryDate { get; set; }
    public string EntryType { get; set; } = default!;
    public string? Category { get; set; }
    public decimal Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? ReferenceNo { get; set; }
    public string? Description { get; set; }
    public string Source { get; set; } = "Manual";
    public Guid? ReferenceId { get; set; }
    public Guid? CreatedBy { get; set; }
}