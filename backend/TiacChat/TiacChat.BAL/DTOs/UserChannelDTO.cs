namespace TiacChat.BAL.DTOs
{
    public class UserChannelDTO
    {
        public int Id { get; set; }
        public int User_Id { get; set; }
        public int Channel_Id { get; set; }
        public bool IsOwner { get;set; }
         public UserChannelDTO()
        {
            
        }

        public UserChannelDTO(int id,int user_id, int channel_id, bool isOwner)
        {
            Id = id;
            User_Id = user_id;
            Channel_Id = channel_id;    
            IsOwner = isOwner;
        }

        public UserChannelDTO(UserChannelDTO userChannelDTO)
        {
            Id = userChannelDTO.Id;
            User_Id = userChannelDTO.User_Id;
            Channel_Id = userChannelDTO.Channel_Id;
            IsOwner = userChannelDTO.IsOwner;
        }
    }
}