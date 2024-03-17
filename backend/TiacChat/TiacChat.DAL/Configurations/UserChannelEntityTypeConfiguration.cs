using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TiacChat.DAL.Entities;

namespace TiacChat.DAL.Configurations
{
    public class UserChannelEntityTypeConfiguration : IEntityTypeConfiguration<UserChannel>
    {
        public void Configure(EntityTypeBuilder<UserChannel> builder)
        {
            builder.ToTable("user_channel");
            
            builder.HasKey(uc => uc.Id);
           // builder.HasNoKey();
            builder.Property(uc => uc.Id).HasColumnName("id").ValueGeneratedOnAdd();
            builder.Property(uc => uc.User_Id).HasColumnName("user_id").IsRequired();
            builder.Property(uc => uc.Channel_Id).HasColumnName("channel_id").IsRequired();
            builder.Property(uc => uc.IsOwner).HasColumnName("isOwner").IsRequired();
            
        }
    }
}