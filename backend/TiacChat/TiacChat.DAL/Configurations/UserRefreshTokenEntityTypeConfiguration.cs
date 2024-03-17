using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TiacChat.DAL.Entities;

namespace TiacChat.DAL.Configurations
{
    public class UserRefreshTokenEntityTypeConfiguration : IEntityTypeConfiguration<UserRefreshToken>
    {
        public void Configure(EntityTypeBuilder<UserRefreshToken> builder)
        {
            builder.ToTable("user_refresh_token");
            builder.HasKey(u => u.Id);

            builder.Property(u => u.Id).HasColumnName("id").ValueGeneratedOnAdd();
            builder.Property(u => u.UserId).HasColumnName("userId").HasMaxLength(100).IsRequired();
            builder.Property(u => u.RefreshToken).HasColumnName("refreshToken").IsRequired();
            builder.Property(u => u.IsActive).HasColumnName("isActive");
            builder.Property(u => u.ExpirationDate).HasColumnName("expirationDate");

            builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(u => u.UserId)
            
            .IsRequired(true);
        }
    }
}