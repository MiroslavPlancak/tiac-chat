using TiacChat.BAL.DTOs;
using TiacChat.BAL.Extensions.Users;
using TiacChat.DAL.Entities;

namespace TiacChat.BAL.Extensions.Messages
{
    public static class Mapper
    {
        public static MessageDTO ToDto(this Message message)
        {
            if(message !=null)
            {
                return new MessageDTO()
                {
                    Id =message.Id,
                    Body = message.Body,
                    SentFromUserId = message.SentFromUserId,
                    SentToUserId = message.SentToUserId,
                    SentToChannelId = message.SentToChannelId ?? 0,
                    Time = message.Time,
                    SentToUserDTO = message.SentToUser.ToDto(),
                    SentFromUserDTO = message.SentFromUser.ToDto(),
                    IsSeen = message.IsSeen
                };
            }
            return null;
        }
        public static Message ToMessage(this MessageDTO messageDTO)
        {
            if(messageDTO != null)
            {
                return new Message()
                {
                    Id =messageDTO.Id,
                    Body = messageDTO.Body,
                    SentFromUserId = messageDTO.SentFromUserId,
                    SentToUserId = messageDTO.SentToUserId ?? 0,
                    SentToChannelId = messageDTO.SentToChannelId,
                    Time = messageDTO.Time,
                    SentFromUser = messageDTO.SentFromUserDTO.ToUser(),
                    SentToUser = messageDTO.SentToUserDTO.ToUser(),
                    IsSeen = messageDTO.IsSeen
                };
            }
            return null;
        }

        public static IEnumerable<MessageDTO> ToDtos(this IEnumerable<Message> messages)
        {
            return messages?.Select(messages => messages.ToDto());
        }

        public static IEnumerable<Message> ToMessages(this IEnumerable<MessageDTO> messagesDTOs)
        {
            return messagesDTOs?.Select(messagesDTOs => messagesDTOs.ToMessage());
        }
    }
}