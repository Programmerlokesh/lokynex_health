using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class ReportTemplateConfiguration : IEntityTypeConfiguration<ReportTemplate>
{
    public void Configure(EntityTypeBuilder<ReportTemplate> builder)
    {
        builder.ToTable("report_templates");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(r => r.Name).HasMaxLength(150).IsRequired();
        builder.Property(r => r.SourceType).HasColumnType("report_source_type").HasDefaultValue(Domain.Enums.ReportSourceType.Manual);
        builder.Property(r => r.OriginalFilePath).HasMaxLength(500);

        builder.HasIndex(r => r.IsDeleted);
    }
}