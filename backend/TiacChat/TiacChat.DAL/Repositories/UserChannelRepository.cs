using TiacChat.DAL.Contracts;
using TiacChat.DAL.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Data.Common;
namespace TiacChat.DAL.Repositories
{   
   
    public class UserChannelRepository : IUserChannelRepository
    {
         private readonly ILogger _logger;
         private readonly DataContext _dataContext;
         
         public UserChannelRepository(ILogger<UserChannel> logger, DataContext dataContext)
         {
            
            _logger = logger;
            _dataContext = dataContext;
         }

  
        public async Task<UserChannel> CreateAsync(UserChannel userChannel)
        {
            try
            {
                var newUserChannel = await _dataContext.UserChannels.AddAsync(userChannel);
                await _dataContext.SaveChangesAsync();
                return newUserChannel.Entity;
            }
            catch(DbException dbUpdateException)
            {
                _logger.LogError(dbUpdateException.ToString());
                throw;
            }
         
        }

        //select the correct userchannel entry and then delete it.
        public Task<UserChannel> GetUserChannelByIdAsync(int userId, int channelId)
        {
            try
            {
                var userChannel =  _dataContext.UserChannels
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.User_Id == userId && c.Channel_Id == channelId);

                return userChannel;
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }

        //select all userChannel objects by userId

        public async Task<IEnumerable<UserChannel>> GetAllUserChannelsByUserIdAsync(int userId)
        {
            try
            {
                var selectUserChannelsByUserId = await _dataContext.UserChannels
                .Where(c => c.User_Id == userId).ToListAsync();
                return selectUserChannelsByUserId;
            }
            catch(Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }
 

        public async Task<int?> DeleteUserChannelByIdsAsync(int userId, int channelId)
        {
             try
            {
                var userToDelete = await GetUserChannelByIdAsync(userId,channelId);

                if(userToDelete != null)
                {
                    _dataContext.UserChannels.Remove(userToDelete);
                    await _dataContext.SaveChangesAsync();
                    return userId;
                }
                else 
                {
                    return null;
                }
            }
            catch(Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }



        public Task<UserChannel> GetByIdAsync(int id)
        {
            throw new NotImplementedException();
        }

        public Task<UserChannel> UpdateAsync(UserChannel updatedObject)
        {
            throw new NotImplementedException();
        }

        public Task<int?> DeleteAsync(int id)
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<UserChannel>> GetAllAsync()
        {
            throw new NotImplementedException();
        }

    }
}