namespace TiacChat.DAL.Entities
{
    public class Message
    {
        public int Id { get; set; } 
        public string Body { get; set; }   
        public int SentFromUserId { get; set; }   
        public int? SentToUserId { get; set; } 
        public int? SentToChannelId { get; set; }
        public bool IsSeen {get;set;}
        public DateTime Time { get; set; }
        public User SentFromUser { get;set; } 
        public User SentToUser { get;set; }
        public Channel SentToChannel { get; set; }
        public Message()
        {
            
        }

        public Message(int id, string body, int sentFromUser, int sentToUser, int sentToChannel, DateTime time, bool isSeen)
        {
            Id = id;
            Body = body;
            SentFromUserId = sentFromUser;
            SentToUserId = sentToUser;
            SentToChannelId = sentToChannel;
            Time = time;
            IsSeen = isSeen;
        }

        public Message(Message message)
        {
            Id = message.Id;
            Body = message.Body;
            SentFromUserId = message.SentFromUserId;
            SentToUserId = message.SentToUserId;
            SentToChannelId = message.SentToChannelId;
            Time = message.Time;
            IsSeen = message.IsSeen;
        }
    }
}