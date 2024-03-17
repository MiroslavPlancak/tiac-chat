using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TiacChat.DAL.Entities;

namespace TiacChat.DAL.Configurations
{
    public class MessageEntityTypeConfiguration : IEntityTypeConfiguration<Message>
    {
        public void Configure(EntityTypeBuilder<Message> builder)
        {
            builder.ToTable("message");
            builder.HasKey(m => m.Id);

            builder.Property(m => m.Id).HasColumnName("id").ValueGeneratedOnAdd();
            builder.Property(m => m.Body).HasColumnName("body").HasMaxLength(500);
            builder.Property(m => m.SentFromUserId).HasColumnName("sentFromUser");
            builder.Property(m => m.SentToUserId).HasColumnName("sentToUser");
            builder.Property(m => m.SentToChannelId).HasColumnName("sentToChannel");
            builder.Property(m => m.Time).HasColumnName("time");
            builder.Property(m => m.IsSeen).HasColumnName("isSeen").IsRequired();

            builder.HasOne(m => m.SentFromUser)
            .WithMany(u => u.MessagesSent)
            .HasForeignKey(m => m.SentFromUserId);

            builder.HasOne(m => m.SentToUser)
            .WithMany(u => u.MessagesReceived)
            .HasForeignKey(m => m.SentToUserId);

            builder.HasOne(m => m.SentToChannel)
            .WithMany(c => c.ChannelMessages)
            .HasForeignKey(c => c.SentToChannelId);
        }
    }
}