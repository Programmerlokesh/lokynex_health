using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("orders");
        builder.HasKey(o => o.Id);
        builder.Property(o => o.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(o => o.OrderNumber).ValueGeneratedOnAdd();
        builder.HasIndex(o => o.OrderNumber).IsUnique();

        builder.Property(o => o.DiscountType).HasColumnType("discount_type").HasDefaultValue(Domain.Enums.DiscountType.Flat);
        builder.Property(o => o.PaymentMethod).HasColumnType("payment_method_type");
        builder.Property(o => o.PaymentStatus).HasColumnType("payment_status_type").HasDefaultValue(Domain.Enums.PaymentStatusType.Open);

        builder.Property(o => o.GrossAmount).HasColumnType("numeric(12,2)");
        builder.Property(o => o.FinalAmount).HasColumnType("numeric(12,2)");
        builder.Property(o => o.PaidAmount).HasColumnType("numeric(12,2)");
        builder.Property(o => o.DiscountValue).HasColumnType("numeric(10,2)");

        builder.HasOne(o => o.Patient).WithMany().HasForeignKey(o => o.PatientId);
        builder.HasOne(o => o.Relative).WithMany().HasForeignKey(o => o.RelativeId);
        builder.HasOne(o => o.Branch).WithMany().HasForeignKey(o => o.BranchId);

        builder.HasMany(o => o.Items).WithOne(i => i.Order).HasForeignKey(i => i.OrderId);

        builder.HasIndex(o => o.BranchId);
        builder.HasIndex(o => o.PaymentStatus);
        builder.HasIndex(o => o.IsDeleted);
    }
}