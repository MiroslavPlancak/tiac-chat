using System.Security.Claims;
using Microsoft.Identity.Client;
using TiacChat.DAL.Entities.Enums;

namespace TiacChat.DAL.Contracts
{
    public interface IJWTManagerRepository
    {
         Task<Tokens> GenerateToken (int userId, string email);
         Task<Tokens> GenerateRefreshToken(int userId, string email);
         ClaimsPrincipal GetPrincipalFromExpiredToken(string email);
         Task flagExpiredRefreshTokenAsInactive(int refreshTokenId);
         Task deleteExpiredRefreshToken(int refreshTokenId);
    }
}