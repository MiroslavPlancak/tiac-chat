using TiacChat.DAL.Entities;

namespace TiacChat.DAL.Contracts
{
    public interface IUserRepository : ICrudRepository<User>
    {
        //TODO: change method names to include Async and their return types to Task<T>
        //TODO: implement nullable returns ?
         Task<bool> IsValidUserAsync(UserLogin users);
         Task<UserRefreshToken> AddUserRefreshTokensAsync(UserRefreshToken user);
         Task<UserRefreshToken?> GetSavedRefreshTokensAsync(int userId, string refreshToken);
         Task<UserRefreshToken?> checkIfRefreshTokenExistsByUserIdAsync(int userId);
         void DeleteUserRefreshTokenAsync(int userId, string refreshToken);
         Task<User> GetUserByEmailAsyncAsync(string email); 
    }
}