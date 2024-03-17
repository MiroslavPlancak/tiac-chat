using Microsoft.Extensions.Logging;
using TiacChat.BAL.DTOs;
using TiacChat.BAL.Extensions.Messages;
using TiacChat.DAL.Contracts;
using TiacChat.DAL.Entities;

namespace TiacChat.BAL.Services
{
    public class MessageServices : IMessageService
    {
        private readonly ILogger _logger;
        private readonly IMessageRepository _repository;
        private readonly IUserRepository _userRepository;

        public MessageServices(ILogger<Message> logger, IMessageRepository repository, IUserRepository userRepository)
        {
            _logger = logger;
            _repository = repository;
            _userRepository = userRepository;
        }

        public async Task<IEnumerable<MessageDTO>> GetAllAsync()
        {
           try
           {
                var messages = await _repository.GetAllAsync();
                return messages.ToDtos();
           }
           catch(Exception e)
           {
             _logger.LogError(e.ToString());
             throw;
           }
        }

        public async Task<MessageDTO> GetByIdAsync(int id)
        {
           try
           {
               var message = await _repository.GetByIdAsync(id);
               return message.ToDto();
           }
           catch(Exception e)
           {
             _logger.LogError(e.ToString());
             throw;
           }
        }
     
        public async Task<IEnumerable<MessageDTO>> GetPrivateMessagesByIdsAsync(int senderId, int receiverID)
        {
         try
         {
            var privateMessage = await _repository.GetPrivateMessageByIdsAsync(senderId, receiverID);
            return privateMessage.Select(message => message.ToDto());

         }catch (Exception e)
         {
            _logger.LogError(e.ToString());
            throw;
         }
        }
      public async Task<IEnumerable<MessageDTO>> GetPaginatedPrivateMessagesByIdsAsync(int senderId, int receiverId, int startIndex, int endIndex)
      {
         try
         {
            var paginatedPrivateMessages = await _repository.GetPaginatedPrivateMessagesByIdsAsync(senderId, receiverId, startIndex, endIndex);
            return paginatedPrivateMessages.Select(message => message.ToDto());
         }
         catch (Exception e)
         {
            _logger.LogError(e.ToString());
            throw;
         }
      }

      public async Task<IEnumerable<MessageDTO>> GetPaginatedPublicChannelMessagesByIdAsync(int channelId, int startIndex, int endIndex)
      {
         try
         {
            var paginatedPublicChannelMessages = await _repository.GetPaginatedPublicChannelMessagesByIdAsync(channelId, startIndex,endIndex);
            return paginatedPublicChannelMessages.Select(message => message.ToDto());
         }
         catch(Exception e)
         {
            _logger.LogError(e.ToString());
            throw;
         }
      }

      public  async Task<int> GetLatestNumberOfPrivateMessagesByIdsAsync(int senderId, int receiverId)
      {
         try
         {
            var countPrivateMessages = await _repository.GetLatestNumberOfPrivateMessagesByIdsAsync(senderId,receiverId);
            return countPrivateMessages;
         }
         catch(Exception e)
         {
            _logger.LogError(e.ToString());
            throw;            
         }
      }

      public async Task<int> GetLatestNumberOfPublicMessagesByChannelIdAsync(int channelId)
      {
         try
         {
            var countPublicChannelMessages = await _repository.GetLatestNumberOfPublicMessagesByChannelIdAsync(channelId);
            return countPublicChannelMessages;
         }
         catch(Exception e)
         {
            _logger.LogError(e.ToString());
            throw;
         }
      }
      public async Task<IEnumerable<MessageDTO>> GetPublicMessagesByChannelIdAsync(int channelid)
        {
            try
            {
               var publicMessagesByChannelId = await _repository.GetPublicMessagesByChannelId(channelid);
               return publicMessagesByChannelId.Select(publicMessages => publicMessages.ToDto());
            }
            catch(Exception e)
            {
               _logger.LogError(e.ToString());
               throw;
            }
        }
        public async Task<MessageDTO> CreateAsync(MessageDTO messageDTO)
        {
           try
           {
               var sentMessage = messageDTO.ToMessage();
               var userThatSentsMessage = await _userRepository.GetByIdAsync(sentMessage.SentFromUserId);
               var newMessage = await _repository.CreateAsync(sentMessage);
               newMessage.SentFromUser = userThatSentsMessage;
               return newMessage.ToDto();
           }
           catch(Exception e)
           {
             _logger.LogError(e.ToString());
             throw;
           }
        }
        public async Task<MessageDTO> UpdateAsync(MessageDTO MessageDTO)
        {
           try
           {
                var updatedMessage = await _repository.UpdateAsync(MessageDTO.ToMessage());
                return updatedMessage.ToDto();
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
              var deletedMessage = await _repository.DeleteAsync(id);
              return deletedMessage;
           }
           catch(Exception e)
           {
             _logger.LogError(e.ToString());
           
             throw;
           }
        }


    }
}