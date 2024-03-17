using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using TiacChat.DAL.Contracts;
using TiacChat.DAL.Entities.Enums;

namespace TiacChat.DAL.Repositories
{
    public class JWTManagerRepository : IJWTManagerRepository
    {
        private readonly IConfiguration _configuration;
        public JWTManagerRepository(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public Tokens GenerateRefreshToken(int userId,string email)
        {
            return GenerateJWTTokens( userId, email);
        }

        public Tokens GenerateToken(int userId, string email)
        {
            return GenerateJWTTokens(userId, email);
        }

        private Tokens GenerateJWTTokens(int userId, string email)
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
                Expires = DateTime.Now.AddMinutes(100),
                SigningCredentials = new SigningCredentials (new SymmetricSecurityKey(tokenKey),SecurityAlgorithms.HmacSha256Signature)
              };

              var token = tokenHandler.CreateToken(tokenDescriptor);
              var refreshToken = GenerateRefreshToken();
              return new Tokens{ AccessToken = tokenHandler.WriteToken(token), RefreshToken = refreshToken};
            }
            catch(Exception e)
            {
                return null;
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