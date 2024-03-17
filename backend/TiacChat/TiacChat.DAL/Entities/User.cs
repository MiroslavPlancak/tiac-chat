namespace TiacChat.DAL.Entities
{
    public class User
    {
        public int Id { get;set; }
        public string FirstName { get;set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Password { get;set; }
        public ICollection<Message> MessagesSent { get;set; } = new List<Message>();
        public ICollection<Message> MessagesReceived { get;set; } = new List<Message>();
        public ICollection<Channel> CreatedChannelsBy {get; set;} = new List<Channel>();
        public ICollection<Channel> ParticipatedChannels { get; set; } = new List<Channel>();
        
       
        
        public User()
        {
            
        }

        public User(int id, string firstName, string lastName, string email, string password)
        {
            Id = id;
            FirstName = firstName;
            LastName  = lastName;
            Email = email;
            Password = password;
        }

        public User(User user)
        {
            Id = user.Id;
            FirstName = user.FirstName;
            LastName = user.LastName;
            Email = user.Email;
            Password = user.Password;
        }
    }
}