using TiacChat.DAL.Entities;

namespace TiacChat.DAL.Contracts
{
    public interface IUserChannelRepository :  ICrudRepository<UserChannel>
    {
           public  Task<int?> DeleteUserChannelByIdsAsync(int userId,int channelId);
           public Task<UserChannel> GetUserChannelByIdAsync(int userId, int channelId);
    }
}