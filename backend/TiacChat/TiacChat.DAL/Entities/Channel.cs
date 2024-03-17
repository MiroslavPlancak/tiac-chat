

using TiacChat.DAL.Entities.Enums;

namespace TiacChat.DAL.Entities
{
    public class Channel
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public VisibilityLevel Visibility  { get; set; }
        public int CreatedBy { get;set; }
        public User? CreatedByUser { get; set; }

        public List<User> Participants { get;set; } = new List<User>();
        public List<Message> ChannelMessages { get;set; } = new List<Message>();
        public Channel()
        {
            
        }

        public Channel(int id, string name, VisibilityLevel visibility, int createdBy)
        {
            Id = id;
            Name = name;
            Visibility = visibility;
            CreatedBy = createdBy;
        }

        public Channel(Channel channel)
        {
            Id = channel.Id;
            Name = channel.Name;
            Visibility = channel.Visibility;
            CreatedBy = channel.CreatedBy;
        }
    }
}