namespace TiacChat.BAL.DTOs
{
    public class MessageDTO
    {
        public int Id { get; set; } 
        public string Body { get; set; }   
        public int SentFromUserId { get; set; }   
        public int SentToUserId { get; set; } 
        public int SentToChannelId { get; set; }
        public bool IsSeen {get;set;}
        public DateTime Time { get; set; }
        public UserDTO SentFromUserDTO { get; set; }
        public UserDTO SentToUserDTO {get;set;}
        public MessageDTO()
        {
            
        }

        public MessageDTO(int id, string body, int sentFromUser, int sentToUser, int sentToChannel, DateTime time, bool isSeen)
        {
            Id =id;
            Body = body;
            SentFromUserId = sentFromUser;
            SentToUserId = sentToUser;
            SentToChannelId = sentToChannel;
            Time = time;
            IsSeen = isSeen;
        }
    }
}