using System.Security.Claims;
using Microsoft.Identity.Client;
using TiacChat.DAL.Entities.Enums;

namespace TiacChat.DAL.Contracts
{
    public interface IJWTManagerRepository
    {
         Tokens GenerateToken (int userId, string email);
         Tokens GenerateRefreshToken(int userId, string email);
         ClaimsPrincipal GetPrincipalFromExpiredToken(string email);
    }
}