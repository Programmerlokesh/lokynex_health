using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace LokynexHealth.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    // Exposes DbContext.Database so Application-layer handlers can run raw SQL
    // (Database.SqlQuery<T>) when they need to bypass EF's normal materialization
    // path for a specific column — e.g. SuperAdminLoginCommandHandler casting an
    // enum to text server-side. Everything else should keep using the DbSets below.
    DatabaseFacade Database { get; }

    DbSet<Branch> Branches { get; }
    DbSet<Role> Roles { get; }
    DbSet<User> Users { get; }
    DbSet<Module> Modules { get; }
    DbSet<UserModulePermission> UserModulePermissions { get; }
    DbSet<Department> Departments { get; }
    DbSet<Test> Tests { get; }

    // READ-ONLY: this lab's effective doctors / referrals (global + this lab's overrides).
    DbSet<Doctor> Doctors { get; }
    DbSet<Referral> Referrals { get; }

    // Writes: global registry (create only) and per-lab overrides (edit / status / delete).
    DbSet<GlobalDoctor> GlobalDoctors { get; }
    DbSet<GlobalReferral> GlobalReferrals { get; }
    DbSet<DoctorLabOverride> DoctorLabOverrides { get; }
    DbSet<ReferralLabOverride> ReferralLabOverrides { get; }

    DbSet<Technician> Technicians { get; }
    DbSet<Patient> Patients { get; }
    DbSet<PatientRelative> PatientRelatives { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<OrderPayment> OrderPayments { get; }
    DbSet<OrderAuditLog> OrderAuditLogs { get; }
    DbSet<CommissionOverride> CommissionOverrides { get; }
    DbSet<CommissionPayout> CommissionPayouts { get; }
    DbSet<LedgerEntry> LedgerEntries { get; }
    DbSet<DoctorClinicSchedule> DoctorClinicSchedules { get; }
    DbSet<DoctorClinicBooking> DoctorClinicBookings { get; }
    DbSet<SuperAdmin> SuperAdmins { get; }
    DbSet<Plan> Plans { get; }
    DbSet<Tenant> Tenants { get; }
    DbSet<TenantBranch> TenantBranches { get; }
    DbSet<Subscription> Subscriptions { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<Owner> Owners { get; }
    DbSet<OwnerLedgerEntry> OwnerLedgerEntries { get; }
    DbSet<ReportTemplate> ReportTemplates { get; }
    DbSet<ReportDocument> ReportDocuments { get; }

    // ---- Doctor Clinic module (platform schema, scoped by clinic_id) ----
    DbSet<Clinic> Clinics { get; }
    DbSet<ClinicUser> ClinicUsers { get; }
    DbSet<ClinicDoctor> ClinicDoctors { get; }
    DbSet<ClinicSchedule> ClinicSchedules { get; }
    DbSet<ClinicBooking> ClinicBookings { get; }
    DbSet<ClinicPatient> ClinicPatients { get; }
    DbSet<ClinicMedicine> ClinicMedicines { get; }
    DbSet<ClinicPrescription> ClinicPrescriptions { get; }
    DbSet<ClinicPrescriptionItem> ClinicPrescriptionItems { get; }
    DbSet<ClinicPrescriptionTest> ClinicPrescriptionTests { get; }
    DbSet<ClinicLedgerEntry> ClinicLedgerEntries { get; }

    // ---- structured blood reports ----
    DbSet<TestParameter> TestParameters { get; }
    DbSet<TestReferenceRange> TestReferenceRanges { get; }
    DbSet<ReportResult> ReportResults { get; }
    DbSet<LabReportSetting> LabReportSettings { get; }
    DbSet<ReportDelivery> ReportDeliveries { get; }
    DbSet<TestReportInfo> TestReportInfos { get; }
    DbSet<ReportOption> ReportOptions { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}