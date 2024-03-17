using TiacChat.BAL.DTOs;
using TiacChat.DAL.Entities;

namespace TiacChat.BAL.Extensions.UserChannels
{
    public static class Mapper
    {
        public static UserChannelDTO ToDto(this UserChannel userChannel)
        {
            if(userChannel !=null)
            {
                return new UserChannelDTO()
                {
                    Id = userChannel.Id,
                    User_Id = userChannel.User_Id,
                    Channel_Id = userChannel.Channel_Id,
                    IsOwner = userChannel.IsOwner
                };
            }

            return null;
        }

        public static UserChannel ToUserChannel(this UserChannelDTO userChannelDTO)
        {
            if(userChannelDTO !=null)
            {
                return new UserChannel
                {
                    Id = userChannelDTO.Id,
                    User_Id = userChannelDTO.User_Id,
                    Channel_Id = userChannelDTO.Channel_Id,
                    IsOwner = userChannelDTO.IsOwner
                };
               
            }
             return null;
        }

        public static IEnumerable<UserChannelDTO> ToDtos(this IEnumerable<UserChannel> userChannels)
        {
            return userChannels?.Select(userChannels => userChannels.ToDto());
        }
        public static IEnumerable<UserChannel> ToUserChannels(this IEnumerable<UserChannelDTO> userChannelsDTO)
        {
            return userChannelsDTO?.Select(userChannelsDTO => userChannelsDTO.ToUserChannel());
        }

    }
}