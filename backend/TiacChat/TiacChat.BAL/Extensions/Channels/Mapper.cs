using TiacChat.DAL.Entities;
using TiacChat.BAL.DTOs;
using TiacChat.DAL.Entities.Enums;
using TiacChat.BAL.Extensions.Users;

namespace TiacChat.BAL.Extensions.Channels
{
    public static class Mapper
    {
        public static ChannelDTO ToDto(this Channel channel)
        {
            if(channel !=null)
            {
                return new ChannelDTO()
                {
                    Id = channel.Id,
                    Name = channel.Name,
                    Visibility = (int)channel.Visibility,
                    CreatedBy = channel.CreatedBy,
                    CreatedByUser = channel.CreatedByUser.ToDto()
                };
               
            }
             return null;
        }

        public static Channel ToChannel(this ChannelDTO channelDTO)
        {
            if(channelDTO != null)
            {
                return new Channel()
                {
                    Id = channelDTO.Id,
                    Name = channelDTO.Name,
                    Visibility = (VisibilityLevel)channelDTO.Visibility,
                    CreatedBy = channelDTO.CreatedBy,
                };
                
            }
            return null;
        }   

        public static IEnumerable<ChannelDTO> ToDtos(this IEnumerable<Channel> channels)
        {
            return channels?.Select(channels => channels.ToDto());
        }

        public static IEnumerable<Channel> ToChannels(this IEnumerable<ChannelDTO> channelsDTO)
        {
            return channelsDTO?.Select(channelsDTO => channelsDTO.ToChannel());
        }
    }
}