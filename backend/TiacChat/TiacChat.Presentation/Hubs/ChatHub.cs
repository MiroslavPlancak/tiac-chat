using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.SignalR;
using TiacChat.BAL.DTOs;
using TiacChat.BAL.Services;

namespace TiacChat.Presentation.Hubs
{
    //[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class ChatHub : Hub
    {
        //private readonly ILogger _logger;
        private readonly IMessageService _messageServices;
        private readonly IChannelService _channelService;
        private readonly IUserService _userService;
        public static Dictionary<int, string> onlineUsers = new Dictionary<int, string>();
        private static Dictionary<int, List<int>> typingUsers = new Dictionary<int, List<int>>();
        public ChatHub
        (
         IMessageService messageServices,
         IChannelService channelService,
         IUserService userService
        )
        {
            _messageServices = messageServices;
            _channelService = channelService;
            _userService = userService;
        }

        public override async Task<Task> OnConnectedAsync()
        {

            if (Context.User.Identity.IsAuthenticated)
            {
                var connectionId = Context.ConnectionId;
                var userId = int.Parse(Context.User.FindFirstValue("userId"));

                Console.WriteLine("UserID value inside of OnConnectedAsync:", connectionId);

                // cleanup (remove) old connection for a user
                if (onlineUsers.ContainsKey(userId))
                {
                    onlineUsers.Remove(userId);
                }

                if (!string.IsNullOrEmpty(connectionId))
                {

                    var findUser = await _userService.GetByIdAsync(userId);
                    var fullUserName = findUser.FirstName + ' ' + findUser.LastName;
                    onlineUsers.Add(userId, connectionId);
                    await Clients.All.SendAsync("YourConnectionId", onlineUsers, userId, fullUserName);


                }

                return base.OnConnectedAsync();
            }
            else
            {
                Console.WriteLine("Aborting connection.");
                Context.Abort();
                return Task.CompletedTask;
            }
        }

        public override async Task<Task> OnDisconnectedAsync(Exception? exception)
        {
            string connectionId = Context.ConnectionId;
            string userId = Context.User.FindFirstValue("userId");
            Console.WriteLine("User disconnected:"+ userId);

            // removing user that is no longer being connected from the client

            if (int.TryParse(userId, out int useridInt))
            {
                onlineUsers.Remove(useridInt);
                // sending updated map to all clients
                var findUser = await _userService.GetByIdAsync(useridInt);
                var fullUserName = findUser.FirstName + ' ' + findUser.LastName;

                await Clients.All.SendAsync("UserDisconnected", onlineUsers, useridInt, fullUserName);
            }



            return base.OnDisconnectedAsync(exception);
        }

        public async Task LogoutUserAsync()
        {
            await OnDisconnectedAsync(null);
        }

        public async Task GetOnlineUsers()
        {
            await Clients.Caller.SendAsync("ReceiveOnlineUsers", onlineUsers);
        }
        public async Task SendPublicMessage(string user, string message)
        {
            await Clients.All.SendAsync("ReceiveMessage", user, message);
        }

        public async Task SendPrivateMessage(int recipientUserId, string message)
        {

            try
            {
                string senderId = Context.User.FindFirstValue("userId");
                var senderIdConverted = int.TryParse(senderId, out int sender);

                var newPrivateMessageDTO = new MessageDTO
                {
                    Body = message,
                    SentFromUserId = sender,
                    SentToUserId = recipientUserId,
                    // SentToChannelId = 7,
                    Time = DateTime.Now,
                    IsSeen = false
                };


                var savedMessage = await _messageServices.CreateAsync(newPrivateMessageDTO);

                if (onlineUsers.TryGetValue(recipientUserId, out var recipientConnectionId))
                {
                    await Clients.Client(recipientConnectionId)
                    .SendAsync("ReceivePrivateMessages", senderId, message, savedMessage.Id, savedMessage.IsSeen);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error in SendPrivateMessage()", ex.Message);
            }
        }

        public async Task NotifyReceiverOfPrivateMessage(MessageDTO privateMessage)
        {
            try
            {
                //string senderId = Context.User.FindFirstValue("userId");
                string senderId = Context.User.FindFirstValue("userId");
                var senderIdConverted = int.TryParse(senderId, out int sender);
                if (privateMessage != null && privateMessage.IsSeen == false && privateMessage.SentToUserId == sender)
                {
                    //message.IsSeen = true;
                    //await _messageServices.UpdateAsync(message);
                    var findMessage = await _messageServices.GetByIdAsync(privateMessage.Id);

                    findMessage.IsSeen = true;
                    await _messageServices.UpdateAsync(findMessage);

                    if (onlineUsers.TryGetValue(privateMessage.SentFromUserId, out var senderConnectionString))
                    {
                        await Clients.Client(senderConnectionString).SendAsync("PrivateMessageReceived", findMessage);
                    }
                }
            }
            catch (Exception e)
            {
                Console.WriteLine("Error in NotifyReceiverOfPrivateMessage()", e.Message);
            }
        }

        public async Task SendPublicMessageTest(int userId, string message, int SentToChannel)
        {
            try
            {
                var messageDTO = new MessageDTO
                {
                    Body = message,
                    SentFromUserId = userId,
                    //SentToUserId = 0,
                    SentToChannelId = SentToChannel,
                    Time = DateTime.Now
                };




                var newMessageDTO = await _messageServices.CreateAsync(messageDTO);


                if (newMessageDTO != null)
                {
                    await Clients.All.SendAsync("ReceiveMessage", newMessageDTO);
                }
            }
            catch (Exception ex)
            {

                Console.WriteLine($"Error in SendPublicMessageTest: {ex.Message}");
                throw;
            }

        }

        public async Task RemoveUserFromPrivateConversation(int userId, int channelId)
        {
            try
            {
                if (onlineUsers.TryGetValue(userId, out var userConnectionId))
                {
                    await Clients.Client(userConnectionId).SendAsync("YouHaveBeenKicked", channelId, userId);
                }


            }
            catch (Exception e)
            {
                Console.WriteLine($"Error {e.Message}");
            }
        }

        public async Task AddUserToPrivateConversation(int userId, int channelId)
        {
            try
            {
                if (onlineUsers.TryGetValue(userId, out var userConnectionId))
                {
                    var entireChannel = await _channelService.GetByIdAsync(channelId);
                    await Clients.Client(userConnectionId).SendAsync("YouHaveBeenAdded", channelId, userId, entireChannel);
                }
            }
            catch (Exception e)
            {
                Console.WriteLine($"Error {e.Message}");
            }
        }

        public async Task CreateNewChannel(string channelName, int channelType, int creatorId)
        {
            try
            {
                var ChannelDTO = new ChannelDTO
                {
                    Name = channelName,
                    Visibility = channelType,
                    CreatedBy = creatorId
                };

                var newChannelDTO = await _channelService.CreateAsync(ChannelDTO);

                if (newChannelDTO != null)
                {
                    foreach (var connectionId in onlineUsers.Values)
                    {
                        Console.WriteLine("broadcasting to all clients that the new channel has been created.");
                    //  if (newChannelDTO.Visibility == 1)
                    //   {
                            await Clients.Client(connectionId).SendAsync("NewChannelCreated", newChannelDTO);
                    //   }

                    }
                    // if (newChannelDTO.Visibility == 0)
                    // {
                    //     if (onlineUsers.TryGetValue(newChannelDTO.CreatedBy, out var userConnectionId))
                    //     {
                    //         await Clients.Client(userConnectionId).SendAsync("NewChannelCreated", newChannelDTO);
                    //     }
                    // }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in CreateNewChannel: {ex.Message}");
                throw;
            }
        }

        public async Task SendTypingStatus(bool isTyping, int senderId, int receiverId)
        {
            try
            {
                if (!typingUsers.ContainsKey(receiverId))
                {
                    typingUsers[receiverId] = new List<int>();
                }

                if (isTyping && !typingUsers[receiverId].Contains(senderId))
                {
                    typingUsers[receiverId].Add(senderId);
                }
                else if (!isTyping)
                {
                    typingUsers[receiverId].Remove(senderId);
                }

                if (onlineUsers.TryGetValue(receiverId, out var receiverConnectionId))
                {
                    await Clients.Client(receiverConnectionId).SendAsync("ReceiveTypingStatus", isTyping, senderId, typingUsers[receiverId]);
                }

            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in SendTypingStatus: {ex.Message}");
                throw;
            }
        }

        public async Task GetLatestNumberOfPrivateMessages(int senderId, int receiverId)
        {
            try
            {
                if (senderId != 0 && receiverId != 0)
                {
                    var latestNumberOfPrivateMessages = await _messageServices.GetLatestNumberOfPrivateMessagesByIdsAsync(senderId, receiverId);

                    if (onlineUsers.TryGetValue(senderId, out var senderConnectionId))
                    {
                        await Clients.Client(senderConnectionId).SendAsync("UpdatedPrivateMessagesNumber", latestNumberOfPrivateMessages);
                    }

                    if (onlineUsers.TryGetValue(receiverId, out var receiverConnectionId))
                    {
                        await Clients.Client(receiverConnectionId).SendAsync("UpdatePrivateMessagesNumber", latestNumberOfPrivateMessages);
                    }
                }


            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetLatestNumberOfPrivateMessages: {ex.Message}");
                throw;
            }
        }

        public async Task GetLatestNumberOfPublicChannelMessages(int channelId, int currentUserId)
        {
            try
            {
                if (channelId != 0)
                {
                    var numberOfPublicChannelMessages = await _messageServices
                    .GetLatestNumberOfPublicMessagesByChannelIdAsync(channelId);

                    if (onlineUsers.TryGetValue(currentUserId, out var currentUserConnectionString))
                    {
                        await Clients.Client(currentUserConnectionString)
                        .SendAsync("UpdatePublicChannelMessagesNumber", numberOfPublicChannelMessages);
                    }


                }


            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetLatestNumberOfPublicChannelMessages: {ex.Message}");
                throw;
            }
        }


    }
}