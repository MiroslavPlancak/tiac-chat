using Microsoft.Extensions.Logging;
using TiacChat.BAL.DTOs;
using TiacChat.BAL.Extensions.Channels;
using TiacChat.DAL.Contracts;
using TiacChat.DAL.Entities;

namespace TiacChat.BAL.Services
{
    public class ChannelService : IChannelService
    {
        private readonly ILogger _logger;
        private readonly IChannelRepository _repository;

        public ChannelService(ILogger<Channel> logger, IChannelRepository repository)
        {
            _logger = logger;
            _repository = repository;
        }
        public async Task<IEnumerable<ChannelDTO>> GetAllAsync()
        {
            try
            {
                var channels = await _repository.GetAllAsync();
                return channels.ToDtos();
            }
            catch(Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }

        public async Task<ChannelDTO> GetByIdAsync(int id)
        {
            try
            {
                var channel = await _repository.GetByIdAsync(id);
                return channel.ToDto();
            }
            catch(Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }
        public async Task<ChannelDTO> CreateAsync(ChannelDTO ChannelDTO)
        {
            try
            {
                var newChannel = await _repository.CreateAsync(ChannelDTO.ToChannel());
                return newChannel.ToDto();
            }
            catch(Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }
        public async Task<ChannelDTO> UpdateAsync(ChannelDTO channelDTO)
        {
            try
            {
                var updateChannel = await _repository.UpdateAsync(channelDTO.ToChannel());
                return updateChannel.ToDto();
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
                var deletedChannel = await _repository.DeleteAsync(id);
                return deletedChannel;
            }
            catch(Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }

        public Task<IEnumerable<ChannelDTO>> GetPrivateChannelsByUserIdsAsync(int id)
        {
            throw new NotImplementedException();
        }

        public Task<UserChannelDTO> AddUserToPrivateConversation(UserChannelDTO addUserChannel)
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<UserChannelDTO>> GetParticipantsOfPrivateChannelAsync(int channelId)
        {
            throw new NotImplementedException();
        }

        public Task<int?> DeleteUserChannelAsync(int userId, int channelId)
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<ChannelDTO>> GetPrivateChannelsByUserIdAsync(int id)
        {
            throw new NotImplementedException();
        }

        public Task<int?> DeleteUserChannelByIdsAsync(int userId, int channelId)
        {
            throw new NotImplementedException();
        }

        public Task<UserChannel> GetUserChannelByIdAsync(int userId, int channelId)
        {
            throw new NotImplementedException();
        }
    }
}