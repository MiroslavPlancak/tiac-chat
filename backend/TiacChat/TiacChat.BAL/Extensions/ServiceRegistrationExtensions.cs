using Microsoft.Extensions.DependencyInjection;
using TiacChat.BAL.Contracts;
using TiacChat.BAL.Services;
using TiacChat.DAL.Entities;

namespace TiacChat.BAL.Extensions
{
    public static class ServicesRegistrationExtension
    {
        public static void ServiceRegistration(this IServiceCollection services)
        {
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IMessageService, MessageServices>();
            services.AddScoped<IChannelService, ChannelServices>();
            services.AddScoped<IUserChannelService, UserChannelServices>();

        }
    }
}