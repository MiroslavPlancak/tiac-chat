using Microsoft.Extensions.Logging;
using TiacChat.BAL.DTOs;
using TiacChat.BAL.Extensions.Channels;
using TiacChat.BAL.Extensions.UserChannels;
using TiacChat.DAL.Contracts;
using TiacChat.DAL.Entities;
using TiacChat.DAL.Repositories;

namespace TiacChat.BAL.Services
{
    public class ChannelServices : IChannelService
    {
        private readonly ILogger _logger;
        private readonly IChannelRepository _repository;
        private readonly IUserChannelRepository _userChannelRepository;

        public ChannelServices
        (
            ILogger<Channel> logger,
            IChannelRepository repository,
            IUserChannelRepository userChannelRepository
        )
            {
                _logger = logger;
                _repository = repository;
                _userChannelRepository = userChannelRepository;
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
        public async Task<IEnumerable<ChannelDTO>> GetPrivateChannelsByUserIdAsync(int id)
        {
            try
            {
                var privateChannels = await _repository.GetPrivateChannelsByUserIdAsync(id);
                return privateChannels.ToDtos();
            }
            catch(Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }

        public async Task<IEnumerable<UserChannelDTO>> GetParticipantsOfPrivateChannelAsync(int channelId)
        {
            try
            {
                var participants = await _repository.GetParticipantsOfPrivateChannelAsync(channelId);
                return participants.ToDtos();
            }
            catch(Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
            
        }

        public async Task<IEnumerable<UserChannelDTO>> GetAllUserChannelsByUserIdAsync(int userId)
        {
            try
            {
                var userChannels = await _userChannelRepository.GetAllUserChannelsByUserIdAsync(userId);
                return userChannels.ToDtos();
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }

        public async Task<UserChannelDTO> AddUserToPrivateConversation(UserChannelDTO addUserChannel)
        {
            try
            {
                var newUserChannelEntry = await _userChannelRepository.CreateAsync(addUserChannel.ToUserChannel());
                return newUserChannelEntry.ToDto();
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

                // UserChannel entry
                var userId = newChannel.CreatedBy;
                var channelId = newChannel.Id;
                
                var UserChannel = new UserChannel
                {
                    User_Id = userId,
                    Channel_Id = channelId,
                    IsOwner = true
                };

                await _userChannelRepository.CreateAsync(UserChannel);


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


        public async Task<int?> DeleteUserChannelByIdsAsync(int userId, int channelId)
        {
            try
            {
                var deletedChannel = await _userChannelRepository.DeleteUserChannelByIdsAsync(userId,channelId);
                return deletedChannel;
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }

        public async Task<UserChannel> GetUserChannelByIdAsync(int userId, int channelId)
        {
            try
            {
                var channel = await _userChannelRepository.GetUserChannelByIdAsync(userId,channelId);
                return channel;
            }
            catch(Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }
    }
}