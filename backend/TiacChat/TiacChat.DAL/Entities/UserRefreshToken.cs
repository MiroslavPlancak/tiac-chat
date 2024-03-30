namespace TiacChat.DAL.Entities
{
    public class UserRefreshToken
    {
        public int Id { get; set;}
        public int UserId { get; set;}
        public string RefreshToken { get; set;}
        public bool IsActive { get; set;} = true;
        public DateTime ExpirationDate { get; set; }

  
    }
}