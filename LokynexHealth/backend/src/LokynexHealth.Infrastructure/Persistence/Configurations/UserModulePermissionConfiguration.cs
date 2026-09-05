using LokynexHealth.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LokynexHealth.Infrastructure.Persistence.Configurations;

public class UserModulePermissionConfiguration : IEntityTypeConfiguration<UserModulePermission>
{
    public void Configure(EntityTypeBuilder<UserModulePermission> builder)
    {
        builder.ToTable("user_module_permissions");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.HasOne(p => p.User)
            .WithMany(u => u.Permissions)
            .HasForeignKey(p => p.UserId);

        builder.HasOne(p => p.Module)
            .WithMany()
            .HasForeignKey(p => p.ModuleId);

        builder.HasIndex(p => new { p.UserId, p.ModuleId }).IsUnique();
    }
}