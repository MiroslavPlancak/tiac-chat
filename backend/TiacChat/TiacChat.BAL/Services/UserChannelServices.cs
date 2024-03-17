using TiacChat.BAL.Contracts;
using TiacChat.BAL.DTOs;

namespace TiacChat.BAL.Services
{
    public class UserChannelServices : IUserChannelService
    {
        public Task<UserChannelDTO> CreateAsync(UserChannelDTO newObject)
        {
            throw new NotImplementedException();
        }

        public Task<int?> DeleteAsync(int id)
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<UserChannelDTO>> GetAllAsync()
        {
            throw new NotImplementedException();
        }

        public Task<UserChannelDTO> GetByIdAsync(int id)
        {
            throw new NotImplementedException();
        }

        public Task<UserChannelDTO> UpdateAsync(UserChannelDTO updatedObject)
        {
            throw new NotImplementedException();
        }
    }
}