using TiacChat.BAL.DTOs;
using TiacChat.DAL.Entities;

namespace TiacChat.BAL.Services
{
    public interface IUserService : IService<UserDTO>
    {
        public Task<bool> IsValidUsers(UserLogin users);
        public Task<UserRefreshToken?> GetSavedRefreshTokensAsync(int userId, string refreshToken);
        Task<UserRefreshToken> AddUserRefreshTokensAsync(UserRefreshToken user);
        void DeleteUserRefreshToken(int userId, string refreshToken);
        Task<UserDTO> GetUserByEmailAsync(string email); 
    }
}