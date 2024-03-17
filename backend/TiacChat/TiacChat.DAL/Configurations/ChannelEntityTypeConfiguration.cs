using TiacChat.DAL.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace TiacChat.DAL.Configurations
{
    public class ChannelEntityTypeConfiguration : IEntityTypeConfiguration<Channel>
    {
        public void Configure(EntityTypeBuilder<Channel> builder)
        {
            builder.ToTable("channel");
            builder.HasKey(c => c.Id);

            builder.Property(c => c.Id).HasColumnName("id").ValueGeneratedOnAdd();
            builder.Property(c => c.Name).HasColumnName("name").HasMaxLength(50);
            builder.Property(c => c.Visibility).HasColumnName("visibility").IsRequired().HasConversion<int>();
            builder.Property(c => c.CreatedBy).HasColumnName("createdBy").IsRequired();
             
             builder.HasOne(c => c.CreatedByUser)
            .WithMany(u => u.CreatedChannelsBy)
            .HasForeignKey(m => m.CreatedBy);
            
           builder.HasMany(c => c.Participants)
           .WithMany(u => u.ParticipatedChannels)
           .UsingEntity(cu => cu.ToTable("channel_user"));

           
           
        }
    }   
}