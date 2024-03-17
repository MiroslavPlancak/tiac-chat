namespace TiacChat.Presentation.Validators
{
    public static class ValidatorRegistrationExtension
    {
        public static void ValidatorRegistration(this IServiceCollection services)
        {
            services.AddScoped<UserDTOValidator>();
            services.AddScoped<MessageDTOValidator>();
            services.AddScoped<ChannelDTOValidator>();
        }
    }
}