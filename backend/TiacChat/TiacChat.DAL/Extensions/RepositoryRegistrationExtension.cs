using Microsoft.Extensions.DependencyInjection;
using TiacChat.DAL.Contracts;
using TiacChat.DAL.Repositories;

namespace TiacChat.DAL.Extensions
{
    public static class RepositoryRegistrationExtension
    {
        public static void RepositoryRegistration(this IServiceCollection services)
        {
            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<IMessageRepository, MessageRepository>();
            services.AddScoped<IChannelRepository, ChannelsRepository>();
            services.AddScoped<IJWTManagerRepository, JWTManagerRepository>();
            services.AddScoped<IUserChannelRepository, UserChannelRepository>();
          
        }
    }
}