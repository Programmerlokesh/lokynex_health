using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(u => u.Name).HasMaxLength(150).IsRequired();

        builder.Property(u => u.Username).HasMaxLength(100).IsRequired();
        builder.HasIndex(u => u.Username).IsUnique();

        builder.Property(u => u.Email).IsRequired();
        builder.HasIndex(u => u.Email).IsUnique();

        builder.Property(u => u.Phone).HasMaxLength(20).IsRequired();
        builder.Property(u => u.Address);
        builder.Property(u => u.Pincode).HasMaxLength(10);
        builder.Property(u => u.ProfilePictureUrl);
        builder.Property(u => u.PasswordHash).HasMaxLength(255).IsRequired();

        builder.Property(u => u.Status)
            .HasConversion<string>()
            .HasColumnType("record_status")
            .HasDefaultValue(Domain.Enums.RecordStatus.Active);

        builder.HasOne(u => u.Branch)
            .WithMany(b => b.Users)
            .HasForeignKey(u => u.BranchId);

        builder.HasOne(u => u.Role)
            .WithMany()
            .HasForeignKey(u => u.RoleId);
    }
}