using System.Security.Authentication.ExtendedProtection;
using TiacChat.BAL.DTOs;
using TiacChat.DAL.Entities;

namespace TiacChat.BAL.Services
{
    public interface IChannelService : IService<ChannelDTO>
    {
        public  Task<IEnumerable<ChannelDTO>> GetPrivateChannelsByUserIdAsync(int id);
        public  Task<UserChannelDTO> AddUserToPrivateConversation(UserChannelDTO addUserChannel);
        public  Task<IEnumerable<UserChannelDTO>> GetParticipantsOfPrivateChannelAsync(int channelId);
        public  Task<int?> DeleteUserChannelByIdsAsync(int userId, int channelId);
        public  Task<UserChannel> GetUserChannelByIdAsync(int userId, int channelId);
    }
}