
namespace TiacChat.BAL.DTOs
{
    public class UserDTO
    {
        public int Id { get;set; }
        public string FirstName { get;set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        // TODO: should never be in the data transfer object, so this should probably be removed
        public string Password { get;set; }

        public UserDTO()
        {
            
        }

        public UserDTO(int id, string firstName, string lastName, string email, string password)
        {
            Id =id;
            FirstName = firstName;
            LastName = lastName;
            Email = email;
            Password = password;
        }

       
    }
}