using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Branch> Branches { get; }
    DbSet<Role> Roles { get; }
    DbSet<User> Users { get; }
    DbSet<Module> Modules { get; }
    DbSet<UserModulePermission> UserModulePermissions { get; }
    DbSet<Department> Departments { get; }
    DbSet<Test> Tests { get; }
    DbSet<Doctor> Doctors { get; }
    DbSet<Referral> Referrals { get; }
    DbSet<Technician> Technicians { get; }
    DbSet<Patient> Patients { get; }
    DbSet<PatientRelative> PatientRelatives { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
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
    DbSet<ReportTemplate> ReportTemplates { get; }
    DbSet<ReportDocument> ReportDocuments { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}