using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

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
        // Model-level enum registrations (used for migrations / model metadata).
        // The runtime EF enum mappings live in Program.cs -> UseNpgsql(..., o => o.MapEnum<T>()).

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

        // ---------- Let EF resolve every native PG enum by its CLR type ----------
        // Entity configurations above set explicit column types such as
        // HasColumnType("record_status") / ("platform.record_status") and, for
        // User and Branch, HasConversion<string>(). EF's enum lookup by store-type
        // name is ambiguous for "record_status" (it exists in BOTH lab_demo and
        // platform) and a string conversion cannot be written to an enum column.
        // So for every enum-typed property we drop the explicit column type and
        // conversion; EF then uses the enum registered in Program.cs
        // (UseNpgsql(..., o => o.MapEnum<T>(...))) for that CLR type.
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                var clrType = Nullable.GetUnderlyingType(property.ClrType) ?? property.ClrType;
                if (!clrType.IsEnum) continue;

                property.SetColumnType(null);
                property.SetProviderClrType(null);
                property.SetValueConverter((ValueConverter?)null);
            }
        }

        base.OnModelCreating(modelBuilder);
    }
}