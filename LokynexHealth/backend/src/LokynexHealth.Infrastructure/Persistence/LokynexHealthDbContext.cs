using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Infrastructure.Persistence;

public class LokynexHealthDbContext : DbContext, IApplicationDbContext
{
    public LokynexHealthDbContext(DbContextOptions<LokynexHealthDbContext> options)
        : base(options)
    {
    }

    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Module> Modules => Set<Module>();
    public DbSet<UserModulePermission> UserModulePermissions => Set<UserModulePermission>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Test> Tests => Set<Test>();
    public DbSet<Doctor> Doctors => Set<Doctor>();
    public DbSet<Referral> Referrals => Set<Referral>();
    public DbSet<Technician> Technicians => Set<Technician>();
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<PatientRelative> PatientRelatives => Set<PatientRelative>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<CommissionOverride> CommissionOverrides => Set<CommissionOverride>();
    public DbSet<CommissionPayout> CommissionPayouts => Set<CommissionPayout>();
    public DbSet<LedgerEntry> LedgerEntries => Set<LedgerEntry>();
    public DbSet<ReportTemplate> ReportTemplates => Set<ReportTemplate>();
    public DbSet<ReportDocument> ReportDocuments => Set<ReportDocument>();
    public DbSet<DoctorClinicSchedule> DoctorClinicSchedules => Set<DoctorClinicSchedule>();
    public DbSet<DoctorClinicBooking> DoctorClinicBookings => Set<DoctorClinicBooking>();
    public DbSet<SuperAdmin> SuperAdmins => Set<SuperAdmin>();
    public DbSet<Plan> Plans => Set<Plan>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<TenantBranch> TenantBranches => Set<TenantBranch>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ---------- ALL Postgres enum registrations MUST happen BEFORE
        // ApplyConfigurationsFromAssembly(), because each entity configuration
        // (e.g. DoctorConfiguration's .HasColumnType("platform.record_status"))
        // needs the enum already registered to resolve it as a native enum
        // instead of silently falling back to a plain int mapping. ----------

        // Tenant-schema enums (lab_demo.*)
        modelBuilder.HasPostgresEnum<Domain.Enums.RecordStatus>("record_status");
        modelBuilder.HasPostgresEnum<Domain.Enums.CommissionType>("commission_type");
        modelBuilder.HasPostgresEnum<Domain.Enums.GenderType>("gender_type");
        modelBuilder.HasPostgresEnum<Domain.Enums.DiscountType>("discount_type");
        modelBuilder.HasPostgresEnum<Domain.Enums.PaymentMethodType>("payment_method_type");
        modelBuilder.HasPostgresEnum<Domain.Enums.PaymentStatusType>("payment_status_type");
        modelBuilder.HasPostgresEnum<Domain.Enums.ReportStatusType>("report_status_type");
        modelBuilder.HasPostgresEnum<Domain.Enums.CommissionEntityType>("commission_entity_type");
        modelBuilder.HasPostgresEnum<Domain.Enums.CommissionStatusType>("commission_status_type");
        modelBuilder.HasPostgresEnum<Domain.Enums.ReportSourceType>("report_source_type");
        modelBuilder.HasPostgresEnum<Domain.Enums.BookingStatusType>("booking_status_type");

        // Platform-schema enums (platform.*)
        modelBuilder.HasPostgresEnum<Domain.Enums.PlatformRecordStatus>("platform.record_status");
        modelBuilder.HasPostgresEnum<Domain.Enums.BillingCycleType>("platform.billing_cycle");
        modelBuilder.HasPostgresEnum<Domain.Enums.SubscriptionStatusType>("platform.subscription_status");

        // Entity configurations run AFTER all enums are registered.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(LokynexHealthDbContext).Assembly);

        base.OnModelCreating(modelBuilder);
    }
}