using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using TiacChat.DAL.Contracts;
using TiacChat.DAL.Entities;

namespace TiacChat.DAL.Repositories
{
    public class ChannelsRepository : IChannelRepository
    {
        private readonly ILogger _logger;
        private readonly DataContext _dataContext;
      
        public ChannelsRepository(ILogger<Channel> logger, DataContext dataContext)
        {
            _logger = logger;
            _dataContext = dataContext;
          
        }

        public async Task<IEnumerable<Channel>> GetAllAsync()
        {
            try
            {
                return await _dataContext.Channels
                .Include(u => u.CreatedByUser)
                .ToListAsync();
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }

        public async Task<Channel> GetByIdAsync(int id)
        {
            try
            {
                var channel = await _dataContext.Channels
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id);

                return channel;


            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }

        public async Task<IEnumerable<Channel>> GetPrivateChannelsByUserIdAsync(int id)
        {
            try {
                var result = await _dataContext.Channels
                    .Join(_dataContext.UserChannels, channel => channel.Id, userCannel => userCannel.Channel_Id, (channel, userChannel) => new {channel, userChannel})
                    .Where(r => 
                        r.userChannel.User_Id == id && 
                        r.channel.Visibility == 0
                    ).ToListAsync();

                return result.Select(r => r.channel);
            }
            catch(Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }
        public async Task<Channel> CreateAsync(Channel newChannel)
        {
            try
            {
                var channel = await _dataContext.Channels.AddAsync(newChannel);
                await _dataContext.SaveChangesAsync();
                return channel.Entity;
            }
            catch (DbUpdateException dbUpdateException)
            {
                _logger.LogError(dbUpdateException.ToString());
                throw;
            }
        }


        public async Task<Channel> UpdateAsync(Channel updatedChannel)
        {
            try
            {
                var channelToUpdate = await GetByIdAsync(updatedChannel.Id);

                if (channelToUpdate != null)
                {
                    channelToUpdate = new Channel(updatedChannel);
                    _dataContext.Update(updatedChannel);
                    await _dataContext.SaveChangesAsync();

                    return channelToUpdate;

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
            var channelToDelete = await GetByIdAsync(id);
            try
            {


                if (channelToDelete != null)
                {
                    _dataContext.Remove(channelToDelete);
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
        // public async Task<int?> DeleteUserChannelAsync(int userId, int channelId)
        // {
        //     try
        //     {
        //         var userChannelToDelete = await _userChannel.GetUserChannelByIdAsync(userId,channelId);

        //         if (userChannelToDelete != null)
        //         {
        //             _dataContext.UserChannels.Remove(userChannelToDelete);
        //             await _dataContext.SaveChangesAsync();
        //             return userId;
        //         }
        //         else
        //         {
        //             return null;
        //         }
        //     }
        //     catch (Exception e)
        //     {
        //         _logger.LogError(e.ToString());
        //         throw;
        //     }
        // }
        public async Task<IEnumerable<UserChannel>> GetParticipantsOfPrivateChannelAsync(int channelId)
        {
            try
            {
                var participants = await _dataContext.UserChannels
                .Where(uc => uc.Channel_Id == channelId)
                // .Include(uc => uc.User)
                .Join(
                    _dataContext.Users,
                    uc => uc.User_Id,
                    user => user.Id,
                    (uc, user) => new UserChannel
                    {
                        User_Id = uc.User_Id,
                        Channel_Id = uc.Channel_Id,
                        IsOwner = uc.IsOwner,
                        // User = new User{
                        //     Id = user.Id,
                        //     FirstName = user.FirstName,
                        //     LastName = user.LastName
                        // }
                    }
                )
                .ToListAsync();

                return participants;

            }catch(DbException dbUpdateException)
            {
                _logger.LogError(dbUpdateException.ToString());
                throw;               
            }
        }


    }
}