using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class ReportDocumentConfiguration : IEntityTypeConfiguration<ReportDocument>
{
    public void Configure(EntityTypeBuilder<ReportDocument> builder)
    {
        builder.ToTable("report_documents");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(r => r.SourceType).HasColumnType("report_source_type").HasDefaultValue(Domain.Enums.ReportSourceType.Manual);
        builder.Property(r => r.OriginalFilePath).HasMaxLength(500);
        builder.Property(r => r.ExportedFilePath).HasMaxLength(500);

        builder.HasOne(r => r.OrderItem).WithMany().HasForeignKey(r => r.OrderItemId);

        builder.HasIndex(r => r.OrderItemId);
        builder.HasIndex(r => r.IsDeleted);
    }
}