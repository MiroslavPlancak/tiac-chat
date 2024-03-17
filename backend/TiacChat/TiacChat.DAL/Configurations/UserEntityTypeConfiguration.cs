using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using TiacChat.DAL.Entities;

namespace TiacChat.DAL.Configurations
{
    public class UserEntityTypeConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            //check the name later.
            builder.ToTable("user");
            builder.HasKey(u => u.Id);
            
            builder.Property(u => u.Id).HasColumnName("id").ValueGeneratedOnAdd();
            builder.Property(u => u.FirstName).HasColumnName("firstName").HasMaxLength(50).IsRequired();
            builder.Property(u => u.LastName).HasColumnName("lastName").HasMaxLength(50).IsRequired();
            builder.Property(u => u.Email).HasColumnName("email").HasMaxLength(100).IsRequired();
            builder.Property(u => u.Password).HasColumnName("password").HasMaxLength(100).IsRequired();
        }
    }
}