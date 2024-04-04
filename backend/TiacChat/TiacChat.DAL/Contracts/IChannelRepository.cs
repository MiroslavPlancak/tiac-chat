using TiacChat.DAL.Entities;

namespace TiacChat.DAL.Contracts
{
    public interface IChannelRepository : ICrudRepository<Channel>
    {
        public Task<IEnumerable<Channel>> GetPrivateChannelsByUserIdAsync(int id);
        public Task<IEnumerable<UserChannel>> GetParticipantsOfPrivateChannelAsync(int channelId);
          
    }
}