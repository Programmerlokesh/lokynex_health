using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class TestParameterConfiguration : IEntityTypeConfiguration<TestParameter>
{
    public void Configure(EntityTypeBuilder<TestParameter> builder)
    {
        builder.ToTable("test_parameters");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(x => x.SectionName).HasMaxLength(100);
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Unit).HasMaxLength(40);
        builder.Property(x => x.Method).HasMaxLength(120);
        builder.Property(x => x.ResultType).HasMaxLength(10);
        builder.Property(x => x.Status)
            .HasColumnType("record_status")
            .HasDefaultValue(Domain.Enums.RecordStatus.Active);

        builder.HasOne<Test>().WithMany().HasForeignKey(x => x.TestId);
        builder.HasMany(x => x.ReferenceRanges).WithOne().HasForeignKey(r => r.ParameterId);
        builder.HasIndex(x => new { x.TestId, x.SortOrder });
    }
}

public class TestReferenceRangeConfiguration : IEntityTypeConfiguration<TestReferenceRange>
{
    public void Configure(EntityTypeBuilder<TestReferenceRange> builder)
    {
        builder.ToTable("test_reference_ranges");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(x => x.Gender).HasColumnType("gender_type");
        builder.Property(x => x.LowValue).HasColumnType("numeric(14,4)");
        builder.Property(x => x.HighValue).HasColumnType("numeric(14,4)");
        builder.Property(x => x.CriticalLow).HasColumnType("numeric(14,4)");
        builder.Property(x => x.CriticalHigh).HasColumnType("numeric(14,4)");
        builder.Property(x => x.NormalText).HasMaxLength(100);
        builder.Property(x => x.DisplayText).HasMaxLength(150).IsRequired();
    }
}

public class ReportResultConfiguration : IEntityTypeConfiguration<ReportResult>
{
    public void Configure(EntityTypeBuilder<ReportResult> builder)
    {
        builder.ToTable("report_results");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(x => x.SectionName).HasMaxLength(100);
        builder.Property(x => x.ParameterName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Unit).HasMaxLength(40);
        builder.Property(x => x.ReferenceText).HasMaxLength(150);
        builder.Property(x => x.ResultValue).HasMaxLength(200);
        builder.Property(x => x.ResultNumeric).HasColumnType("numeric(14,4)");
        builder.Property(x => x.Flag).HasMaxLength(10).IsRequired();

        builder.HasOne<ReportDocument>().WithMany().HasForeignKey(x => x.ReportDocumentId);
        builder.HasOne<TestParameter>().WithMany().HasForeignKey(x => x.ParameterId);
        builder.HasIndex(x => new { x.ReportDocumentId, x.SortOrder });
    }
}

public class LabReportSettingConfiguration : IEntityTypeConfiguration<LabReportSetting>
{
    public void Configure(EntityTypeBuilder<LabReportSetting> builder)
    {
        builder.ToTable("lab_report_settings");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(x => x.PathologistName).HasMaxLength(150);
        builder.Property(x => x.PathologistQualification).HasMaxLength(200);
        builder.Property(x => x.RegistrationNo).HasMaxLength(60);
    }
}

public class ReportDeliveryConfiguration : IEntityTypeConfiguration<ReportDelivery>
{
    public void Configure(EntityTypeBuilder<ReportDelivery> builder)
    {
        builder.ToTable("report_deliveries");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(x => x.Channel).HasMaxLength(10).IsRequired();
        builder.Property(x => x.SentTo).HasMaxLength(20);
        builder.Property(x => x.Status).HasMaxLength(10).IsRequired();

        builder.HasOne<ReportDocument>().WithMany().HasForeignKey(x => x.ReportDocumentId);
    }
}

public class TestReportInfoConfiguration : IEntityTypeConfiguration<TestReportInfo>
{
    public void Configure(EntityTypeBuilder<TestReportInfo> builder)
    {
        builder.ToTable("test_report_info");
        builder.HasKey(x => x.TestId);

        builder.Property(x => x.Specimen).HasMaxLength(120);
        builder.Property(x => x.Method).HasMaxLength(200);
        builder.Property(x => x.MachineName).HasMaxLength(150);
        builder.Property(x => x.ReagentName).HasMaxLength(200);

        builder.HasOne<Test>().WithMany().HasForeignKey(x => x.TestId);
    }
}


public class ReportOptionConfiguration : IEntityTypeConfiguration<ReportOption>
{
    public void Configure(EntityTypeBuilder<ReportOption> builder)
    {
        builder.ToTable("report_options");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(x => x.Kind).HasMaxLength(10).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
    }
}