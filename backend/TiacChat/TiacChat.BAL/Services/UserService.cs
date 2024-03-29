using Microsoft.Extensions.Logging;
using TiacChat.BAL.DTOs;
using TiacChat.BAL.Extensions.Users;
using TiacChat.DAL.Contracts;
using TiacChat.DAL.Entities;

namespace TiacChat.BAL.Services
{
    public class UserService : IUserService
    {
        private readonly ILogger _logger;
        private readonly IUserRepository _repository;

        public UserService(ILogger<User> logger, IUserRepository repository)
        {
            _logger = logger;
            _repository = repository;
        }
        public async Task<IEnumerable<UserDTO>> GetAllAsync()
        {
            try
            {
                var users = await _repository.GetAllAsync();
                return users.ToDtos();
            }
            catch(Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }
        public async Task<UserDTO> GetByIdAsync(int id)
        {
            try
            {
                var user = await _repository.GetByIdAsync(id);
                return user.ToDto();
            }
            catch(Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }
        public async Task<UserDTO> CreateAsync(UserDTO UserDTO)
        {
            try
            {
                var newUser = await _repository.CreateAsync(UserDTO.ToUser());
                return newUser.ToDto();
            }
            catch(Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }
        public async Task<UserDTO> UpdateAsync(UserDTO UserDTO)
        {
            try
            {
                var updatedUser = await _repository.UpdateAsync(UserDTO.ToUser());
                return updatedUser.ToDto();
            }
            catch(Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }
        public async Task<int?> DeleteAsync(int id)
        {
            try
            {
                var deletedUser = await _repository.DeleteAsync(id);
                return deletedUser;
            }
            catch(Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }

        //token logic
       public async Task<bool> IsValidUsers(UserLogin users)
       {
         var isValid = await _repository.IsValidUserAsync(users);
         return isValid;
       }

        public async Task<UserRefreshToken?> GetSavedRefreshTokensAsync(int userId, string refreshToken)
        {
            var userRefreshToken = await _repository.GetSavedRefreshTokensAsync(userId, refreshToken);
            return userRefreshToken;
        }
        public async Task<UserRefreshToken> checkIfRefreshTokenExistsByUserIdAsync(int userId)
        {
            try
            {
                var existingRefreshTokenByUserId = await _repository.checkIfRefreshTokenExistsByUserIdAsync(userId);
                return existingRefreshTokenByUserId;
            }catch(Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }


        }
        public Task<UserRefreshToken> AddUserRefreshTokensAsync(UserRefreshToken user)
        {
            var addUserRefreshTokens = _repository.AddUserRefreshTokensAsync(user);
            return addUserRefreshTokens;
        }

        public void DeleteUserRefreshToken(int userId, string refreshToken)
        {
             _repository.DeleteUserRefreshTokenAsync(userId, refreshToken);
        }

        public async Task<UserDTO> GetUserByEmailAsync(string email)
        {
            var user = await _repository.GetUserByEmailAsyncAsync(email);
            return user.ToDto();
        }
    }
}