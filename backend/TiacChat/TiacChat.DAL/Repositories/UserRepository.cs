using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TiacChat.DAL.Contracts;
using TiacChat.DAL.Entities;

namespace TiacChat.DAL.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly ILogger _logger;
        private readonly DataContext _dataContext;

        public UserRepository(ILogger<User> logger, DataContext dataContext)
        {
            _logger = logger;
            _dataContext = dataContext;
        }

        public async Task<IEnumerable<User>> GetAllAsync()
        {
            try
            {
                return await _dataContext.Users.ToListAsync();
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }

        public async Task<User> GetByIdAsync(int id)
        {
            try
            {
                var user = await _dataContext.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == id);

                return user;
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }

        public async Task<User> CreateAsync(User newUser)
        {
            try
            {
                var user = await _dataContext.Users.AddAsync(newUser);
                await _dataContext.SaveChangesAsync();
                return user.Entity;
            }
            catch (DbUpdateException dbUpdateException)
            {
                _logger.LogError(dbUpdateException.ToString());
                return null;
            }
        }

        public async Task<User> UpdateAsync(User updatedUser)
        {
            try
            {
                var userTOUpdate = await GetByIdAsync(updatedUser.Id);
                if (userTOUpdate != null)
                {
                    userTOUpdate = new User(updatedUser);
                    _dataContext.Users.Update(updatedUser);
                    await _dataContext.SaveChangesAsync();
                    return userTOUpdate;
                }
                else
                {
                    return null;
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }

        public async Task<int?> DeleteAsync(int id)
        {
            try
            {
                var userToDelete = await GetByIdAsync(id);

                if (userToDelete != null)
                {
                    _dataContext.Users.Remove(userToDelete);
                    await _dataContext.SaveChangesAsync();
                    return id;
                }
                else
                {
                    return null;
                }
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }
        public async Task<bool> IsValidUserAsync(UserLogin users)
        {
            var u = await _dataContext.Users.FirstOrDefaultAsync(
                o => o.Email == users.Email &&
                o.Password == users.Password);

            if (u != null)

                return true;
            else
                return false;
        }

        public async Task<UserRefreshToken> AddUserRefreshTokensAsync(UserRefreshToken userRefreshToken)
        {
            _dataContext.UserRefreshTokens.Add(userRefreshToken);
            _dataContext.SaveChanges();
            return userRefreshToken;
        }

        public async Task<UserRefreshToken?> checkIfRefreshTokenExistsByUserIdAsync(int userId)
        {
            try
            {
                return await _dataContext.UserRefreshTokens
                      .FirstOrDefaultAsync(
                          u => u.UserId == userId
                      );
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }

        }
        public async Task<UserRefreshToken?> GetSavedRefreshTokensAsync(int userId, string refreshToken)
        {
            return await _dataContext.UserRefreshTokens
            .FirstOrDefaultAsync(
                x => x.UserId == userId &&
                x.RefreshToken == refreshToken
                );
        }

        public void DeleteUserRefreshTokenAsync(int userId, string refreshToken)
        {
            var item = _dataContext.UserRefreshTokens.FirstOrDefault(x => x.UserId == userId &&
            x.RefreshToken == refreshToken);
            if (item != null)
            {
                _dataContext.Remove(item);

                _dataContext.SaveChanges();
            }
            else
            {
                throw new Exception($"Refresh token not found by UserID: {userId} and refresh token {refreshToken}");
            }
        }

        public async Task<User> GetUserByEmailAsyncAsync(string email)
        {
            var user = await _dataContext.Users.FirstOrDefaultAsync(u => u.Email == email);
            return user;
        }
    }

}