using TiacChat.BAL.DTOs;
using TiacChat.DAL.Entities;

namespace TiacChat.BAL.Services
{
    public interface IMessageService : IService<MessageDTO>
    {
         public Task<IEnumerable<MessageDTO>> GetPrivateMessagesByIdsAsync(int senderId, int receiverId);
         public Task<IEnumerable<MessageDTO>> GetPublicMessagesByChannelIdAsync(int channelid);
         public Task<IEnumerable<MessageDTO>> GetPaginatedPrivateMessagesByIdsAsync(int senderId, int receiverId, int startIndex, int endIndex);
         public Task<int> GetLatestNumberOfPrivateMessagesByIdsAsync(int senderId, int receiverId);
         public Task<IEnumerable<MessageDTO>> GetPaginatedPublicChannelMessagesByIdAsync(int channelId,int startIndex, int endIndex);
         public Task<int> GetLatestNumberOfPublicMessagesByChannelIdAsync(int channelId);
    }
}