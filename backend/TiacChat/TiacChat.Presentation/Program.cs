
using TiacChat.DAL;
using TiacChat.DAL.Extensions;
using TiacChat.BAL.Extensions;
using TiacChat.Presentation.Validators;
using TiacChat.Presentation.Hubs;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Text;
using System.Configuration;
using Microsoft.IdentityModel.Tokens;
using FluentAssertions.Common;
using TiacChat.DAL.Contracts;
using TiacChat.DAL.Repositories;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c => 
{
    c.SwaggerDoc("v1", new OpenApiInfo {Title = "RefreshTokenDemo", Version = "v1"});
});

// Register DbContext,Logger,RepositoryRegistration,ServiceRegistration
builder.Services.AddDbContext<DataContext>();
builder.Services.AddLogging();
builder.Services.RepositoryRegistration();
builder.Services.ServiceRegistration();
builder.Services.ValidatorRegistration();

//Add SignalR

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy",
        builder => builder
            .AllowAnyMethod()
            .AllowAnyHeader()
            .WithOrigins("http://localhost:4200","http://localhost:4201","http://localhost:4202","http://localhost:4203") 
            .AllowCredentials()); 
});


//Add identity settings
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options => 
    {
      options.Password.RequireUppercase = true;
      options.Password.RequireDigit = true;
      options.SignIn.RequireConfirmedEmail = true;
    }
   
).AddEntityFrameworkStores<DataContext>().AddDefaultTokenProviders();

//Add Authentication settings
builder.Services.AddAuthentication(x => 
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(o => 
{
    var Key = Encoding.UTF8.GetBytes(builder.Configuration["JWT:Key"]);
    o.SaveToken = true;
    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true, 
        ValidIssuer = builder.Configuration["JWT:Issuer"],
        ValidAudience = builder.Configuration["JWT:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Key),
        ClockSkew= TimeSpan.Zero
    };

    o.Events = new JwtBearerEvents{
        OnMessageReceived = context => {
            var AccessToken = context.Request.Query["access_token"];
            if(context.HttpContext.Request.Path.StartsWithSegments("/ChatHub")){
                if(!string.IsNullOrEmpty(AccessToken) )
                    context.Token = AccessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddSingleton<IJWTManagerRepository, JWTManagerRepository>();


//add SingnalR
builder.Services.AddSignalR();

var app = builder.Build();

app.UseCors("CorsPolicy");
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "RefreshTokenDemo v1"));
}

//add authentication
app.UseAuthentication();
app.UseAuthorization();

app.MapHub<ChatHub>("/ChatHub");
app.MapControllers();

app.Run();
