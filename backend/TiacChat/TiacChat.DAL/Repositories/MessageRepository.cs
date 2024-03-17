using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Update.Internal;
using Microsoft.Extensions.Logging;
using Microsoft.Identity.Client;
using TiacChat.DAL.Contracts;
using TiacChat.DAL.Entities;

namespace TiacChat.DAL.Repositories
{
    public class MessageRepository : IMessageRepository
    {
        private readonly ILogger _logger;
        private readonly DataContext _dataContext;

        public MessageRepository(ILogger<Message> logger, DataContext dataContext)
        {
            _logger = logger;
            _dataContext = dataContext;
        }

        public async Task<IEnumerable<Message>> GetAllAsync()
        {
            try
            {
                return await _dataContext.Messages
                .Include(m => m.SentFromUser)
                .Include(m => m.SentToUser)
                .ToListAsync();
            }
            catch(Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }

        public async Task<Message> GetByIdAsync(int id)
        {
            try
            {
                var message = await _dataContext.Messages
                .Include(m => m.SentFromUser)
                .Include(m => m.SentToUser)
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == id);
                 return message;
                     
            }
            catch(Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }         
        }

        public async Task<IEnumerable<Message>> GetPrivateMessageByIdsAsync(int senderId, int receiverId)
        {
            try
            {
                var privateMessage = await _dataContext.Messages.Where
                (
                    pMesage => (pMesage.SentFromUserId == senderId && pMesage.SentToUserId == receiverId)||
                               (pMesage.SentFromUserId == receiverId && pMesage.SentToUserId == senderId)
                ).ToListAsync();

                return privateMessage;
            } catch(Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }


        public async Task<IEnumerable<Message>> GetPaginatedPrivateMessagesByIdsAsync(int senderId, int receiverId, int startIndex, int endIndex)
        {
            try
            {
                var convertNegativeResult = Math.Abs(endIndex - startIndex);

                var paginatedPrivateMessages = await _dataContext.Messages  
                .Where(pMessage =>
                (pMessage.SentFromUserId == senderId && pMessage.SentToUserId == receiverId) ||
                (pMessage.SentFromUserId == receiverId && pMessage.SentToUserId == senderId))
                .OrderByDescending(pMessage => pMessage.Time)
                .Skip(startIndex)
                .Take(convertNegativeResult)
                .ToListAsync();
                return paginatedPrivateMessages;
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }

        public async Task<IEnumerable<Message>> GetPaginatedPublicChannelMessagesByIdAsync(int channelId,int startIndex, int endIndex)
        {
            try
            {
                var convertNegativeResult = Math.Abs(endIndex - startIndex);

                var paginatedPublicChannelMessages = await _dataContext.Messages
                .Include(m => m.SentToChannel)
                .Include(m => m.SentFromUser)
               // .Include(m => m.SentToUser)
                .Where(m => m.SentToChannelId == channelId)
                .OrderByDescending(pubChanMsg => pubChanMsg.Time)
                .Skip(startIndex)
                .Take(convertNegativeResult)
                .ToListAsync();
                return paginatedPublicChannelMessages;
            }
            catch(Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }
        public async Task<int> GetLatestNumberOfPrivateMessagesByIdsAsync(int senderId, int receiverId)
        {
            try
            {
                var countPrivateMessages = await _dataContext.Messages
                .Where(pMessage =>
                (pMessage.SentFromUserId == senderId && pMessage.SentToUserId == receiverId) ||
                (pMessage.SentFromUserId == receiverId && pMessage.SentToUserId == senderId))
                .CountAsync();

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
                var countPublicChannelMessages = await _dataContext.Messages
                .Where(messsage => messsage.SentToChannel.Id == channelId)
                .CountAsync();
                return countPublicChannelMessages;
            }
            catch(Exception e)
            {
             _logger.LogError(e.ToString());
              throw;
            }
        }

        public async Task<IEnumerable<Message>> GetPublicMessagesByChannelId(int channelid)
        {
            try
            {
                var publicMessagesByChannelId = await _dataContext.Messages
                .Include(m => m.SentToChannel)
                .Include(m => m.SentFromUser)
                .Include(m => m.SentToUser)
                .Where(m => m.SentToChannelId == channelid).ToListAsync();
                return publicMessagesByChannelId;
            } 
            catch (Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }

        public async Task<Message> CreateAsync(Message newObject)
        {
            try
            {
                var message = await _dataContext.Messages.AddAsync(newObject);
                await _dataContext.SaveChangesAsync();
                return message.Entity;

            }
            catch(DbUpdateException dbUpdateException)
            {
                _logger.LogError(dbUpdateException.ToString());
                return null;
            }
        }

        public async Task<Message> UpdateAsync(Message updatedObject)
        {
            try
            {
                var objectToUpdate = await GetByIdAsync(updatedObject.Id);

                if(objectToUpdate != null)
                {
                    objectToUpdate = new Message(updatedObject);
                    _dataContext.Messages.Update(updatedObject);
                    await _dataContext.SaveChangesAsync();
                    return objectToUpdate;
                }
                else
                {
                    return null;
                }
            }
            catch(Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }

        public async Task<int?> DeleteAsync(int id)
        {
            var messageToDelete = await GetByIdAsync(id);
            Console.WriteLine(messageToDelete?.Id);
            try
            {
                if(messageToDelete != null)
                {
                     _dataContext.Messages.Remove(messageToDelete);
                     await _dataContext.SaveChangesAsync();
                    return id;
                }
                else
                {
                    return null;
                }
            }
            catch(Exception e)
            {
                _logger.LogError(e.ToString());
                throw;
            }
        }

     
    }
}