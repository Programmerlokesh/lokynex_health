using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class OrderPaymentConfiguration : IEntityTypeConfiguration<OrderPayment>
{
    public void Configure(EntityTypeBuilder<OrderPayment> builder)
    {
        builder.ToTable("order_payments");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(p => p.Amount).HasColumnType("numeric(12,2)");
        builder.Property(p => p.PaymentMethod).HasColumnType("payment_method_type");
        builder.Property(p => p.PaidAt).HasDefaultValueSql("now()");

        builder.HasOne(p => p.Order).WithMany(o => o.Payments).HasForeignKey(p => p.OrderId);
        builder.HasIndex(p => p.OrderId);
    }
}