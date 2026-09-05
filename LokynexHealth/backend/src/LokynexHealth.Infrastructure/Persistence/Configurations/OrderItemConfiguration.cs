using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable("order_items");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(i => i.Price).HasColumnType("numeric(10,2)");
        builder.Property(i => i.DoctorCommissionAmount).HasColumnType("numeric(10,2)");
        builder.Property(i => i.ReferralCommissionAmount).HasColumnType("numeric(10,2)");
        builder.Property(i => i.TechnicianCommissionAmount).HasColumnType("numeric(10,2)");
        builder.Property(i => i.ReportStatus).HasColumnType("report_status_type").HasDefaultValue(Domain.Enums.ReportStatusType.Pending);

        builder.HasOne(i => i.Test).WithMany().HasForeignKey(i => i.TestId);

        builder.HasIndex(i => i.OrderId);
        builder.HasIndex(i => i.TestId);
    }
}