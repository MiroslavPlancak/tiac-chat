using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TiacChat.DAL.Configurations;
using TiacChat.DAL.Entities;

namespace TiacChat.DAL
{
    public class DataContext :  IdentityDbContext<IdentityUser>
    {
       public DbSet<User> Users { get;set; }
       public DbSet<Channel> Channels { get;set; }
       public DbSet<Message> Messages { get;set; }
       public DbSet<UserChannel> UserChannels { get;set; }
       public DbSet<UserRefreshToken> UserRefreshTokens { get; set;}
       
        private readonly IConfiguration _configuration;

        public DataContext(DbContextOptions options, IConfiguration configuration): base(options)
        {
            _configuration = configuration;
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            //connection to db 
            //optionsBuilder.UseSqlServer(_configuration["DefaultConnection:ConnectionString"]);
            optionsBuilder.UseSqlServer(_configuration.GetConnectionString("DefaultConnection"));
            base.OnConfiguring(optionsBuilder);
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            //IEntityTypeConfigurations go here
            modelBuilder.ApplyConfiguration(new UserEntityTypeConfiguration());
            modelBuilder.ApplyConfiguration(new MessageEntityTypeConfiguration());
            modelBuilder.ApplyConfiguration(new ChannelEntityTypeConfiguration());
            modelBuilder.ApplyConfiguration(new UserChannelEntityTypeConfiguration());
            modelBuilder.ApplyConfiguration(new UserRefreshTokenEntityTypeConfiguration());
          
            base.OnModelCreating(modelBuilder);
        }
    }
}