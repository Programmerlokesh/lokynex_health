using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class OrderAuditLogConfiguration : IEntityTypeConfiguration<OrderAuditLog>
{
    public void Configure(EntityTypeBuilder<OrderAuditLog> builder)
    {
        builder.ToTable("order_audit_logs");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(a => a.ChangedByName).HasMaxLength(150);
        builder.Property(a => a.Action).HasMaxLength(20).IsRequired();
        builder.Property(a => a.ChangedAt).HasDefaultValueSql("now()");
        builder.Property(a => a.OldValues).HasColumnType("jsonb");
        builder.Property(a => a.NewValues).HasColumnType("jsonb");

        builder.HasOne(a => a.Order).WithMany(o => o.AuditLogs).HasForeignKey(a => a.OrderId);
        builder.HasIndex(a => a.OrderId);
    }
}