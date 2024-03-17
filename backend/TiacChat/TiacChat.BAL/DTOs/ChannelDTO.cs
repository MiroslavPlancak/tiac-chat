using TiacChat.DAL.Entities;

namespace TiacChat.BAL.DTOs
{
    public class ChannelDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int Visibility { get; set; } 
        public int CreatedBy { get; set; }
        public UserDTO? CreatedByUser {get;set;} 
        // Other properties...

        public ChannelDTO()
        {
        }

        public ChannelDTO(int id, string name, int visibility, int createdBy)
        {
            Id = id;
            Name = name;
            Visibility = visibility;
            CreatedBy = createdBy;
        }
    }
}