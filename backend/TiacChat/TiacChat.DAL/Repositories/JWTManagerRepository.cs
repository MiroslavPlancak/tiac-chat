using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using TiacChat.DAL.Contracts;
using TiacChat.DAL.Entities;
using TiacChat.DAL.Entities.Enums;

namespace TiacChat.DAL.Repositories
{
    public class JWTManagerRepository : IJWTManagerRepository
    {
        private readonly IConfiguration _configuration;
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<JWTManagerRepository> _logger;
        public JWTManagerRepository(IConfiguration configuration,ILogger<JWTManagerRepository> logger, IServiceProvider serviceProvider)
        {
            _configuration = configuration; 
            _logger = logger;
            _serviceProvider = serviceProvider;
           
           
        }

        public Task<Tokens> GenerateRefreshToken(int userId,string email)
        {
            return GenerateJWTTokens( userId, email);
        }

        public Task<Tokens> GenerateToken(int userId, string email)
        {
            return GenerateJWTTokens(userId, email);
        }

        private async Task<Tokens> GenerateJWTTokens(int userId, string email)
        {
            try
            {
              var tokenHandler = new JwtSecurityTokenHandler();
              var tokenKey = Encoding.UTF8.GetBytes(_configuration["JWT:Key"]);
              var tokenDescriptor = new SecurityTokenDescriptor
              {
                Subject = new ClaimsIdentity(new Claim[]
                {
                    new Claim(ClaimTypes.Name, email),
                    new Claim("userId", userId.ToString())
                }),
                Expires = DateTime.Now.AddMinutes(3),
                SigningCredentials = new SigningCredentials (new SymmetricSecurityKey(tokenKey),SecurityAlgorithms.HmacSha256Signature)
              };
                
              var token = tokenHandler.CreateToken(tokenDescriptor);

                // Check if refresh token exists
                var existingRefreshToken = await checkIfRefreshTokenExistsByUserIdAsync(userId);
                string refreshToken;
                if (existingRefreshToken == null)
                {
                    refreshToken = GenerateRefreshToken();
                }
                else
                {   Console.WriteLine("XXXXXXXXXXXXXXXXXXX");
                    refreshToken = existingRefreshToken.RefreshToken;
                }
                    
              return new Tokens{ AccessToken = tokenHandler.WriteToken(token), RefreshToken = refreshToken, IsRefreshTokenValid = existingRefreshToken?.IsActive};
            }
            catch(Exception e)
            {
                return null;
            }
        }
        public async Task deleteExpiredRefreshToken(int refreshTokenId)
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var dataContext = scope.ServiceProvider.GetRequiredService<DataContext>();
                try
                {
                    var selectRefreshTokenForDeletion = await dataContext.UserRefreshTokens
                    .FirstOrDefaultAsync(rtd => rtd.Id == refreshTokenId);
                    if(selectRefreshTokenForDeletion != null)
                    {
                         dataContext.Remove(selectRefreshTokenForDeletion);
                         dataContext.SaveChanges();
                    }
                   
                }
                catch (Exception e)
                {
                    _logger.LogError(e.ToString());
                    throw;
                }
            }
        }
        public async Task<UserRefreshToken?> checkIfRefreshTokenExistsByUserIdAsync(int userId)
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var dataContext = scope.ServiceProvider.GetRequiredService<DataContext>();
                try
                {
                    return await dataContext.UserRefreshTokens
                        .FirstOrDefaultAsync(u => u.UserId == userId);
                }
                catch (Exception e)
                {
                    _logger.LogError(e.ToString());
                    throw;
                }
            }
        }

        public async Task flagExpiredRefreshTokenAsInactive(int refreshTokenId)
        {
            using(var scope = _serviceProvider.CreateScope())
            {
                var dataContext = scope.ServiceProvider.GetRequiredService<DataContext>();
                try
                {
                    var selectRefreshToken = await dataContext.UserRefreshTokens
                    .FirstOrDefaultAsync(rt => rt.Id == refreshTokenId);
                  
                    if (selectRefreshToken != null && selectRefreshToken.IsActive != false)
                    {
                        
                        selectRefreshToken.IsActive = false;

                        
                        await dataContext.SaveChangesAsync();
                    }
 
                    
                }
                catch(Exception e)
                {
                    _logger.LogError(e.ToString());
                    throw;
                }
            }
        }
        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];

            using(var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomNumber);
                return Convert.ToBase64String(randomNumber);
            }
        }

        public ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
        {
           var Key = Encoding.UTF8.GetBytes(_configuration["JWT:Key"]);

           var tokenValidationParameters = new TokenValidationParameters
           {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Key),
            ClockSkew= TimeSpan.Zero
           };

           var tokenHandler = new JwtSecurityTokenHandler();
           var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);
           JwtSecurityToken jwtSecurityToken = securityToken as JwtSecurityToken;

           if(jwtSecurityToken == null || 
           !jwtSecurityToken.Header.Alg
           .Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
           {
            throw new SecurityTokenException("Invalid Token");
           }
           return principal;
        }
    }


}