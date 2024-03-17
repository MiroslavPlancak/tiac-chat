namespace TiacChat.DAL.Entities
{
    public class UserChannel
    {
        public int Id { get; set; }
        public int User_Id { get; set; }
        public int Channel_Id { get; set; }
        public bool IsOwner { get;set; }
        // public User User {get;set;}

        public UserChannel()
        {
            
        }

        public UserChannel(int id, int user_id, int channel_id)
        {
            Id = id;
            User_Id = user_id;
            Channel_Id = channel_id;    
        }

        public UserChannel(UserChannel userChannel)
        {
            Id = userChannel.Id;
            User_Id = userChannel.User_Id;
            Channel_Id = userChannel.Channel_Id;
        }
    }
}