using TiacChat.DAL.Entities;

namespace TiacChat.DAL.Contracts
{
    public interface IMessageRepository : ICrudRepository<Message>
    {
         public Task<IEnumerable<Message>> GetPrivateMessageByIdsAsync(int senderId, int receiverId);
         public  Task<IEnumerable<Message>> GetPublicMessagesByChannelId(int channelid);
         Task<IEnumerable<Message>> GetPaginatedPrivateMessagesByIdsAsync(int senderId, int receiverId, int startIndex, int endIndex);
         Task<int> GetLatestNumberOfPrivateMessagesByIdsAsync(int senderId, int receiverId);
         Task<IEnumerable<Message>> GetPaginatedPublicChannelMessagesByIdAsync(int channelId,int startIndex, int endIndex);
         Task<int> GetLatestNumberOfPublicMessagesByChannelIdAsync(int channelId);
    }
}