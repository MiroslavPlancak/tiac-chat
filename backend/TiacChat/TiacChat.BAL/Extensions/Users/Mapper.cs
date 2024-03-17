using TiacChat.BAL.DTOs;
using TiacChat.DAL.Entities;

namespace TiacChat.BAL.Extensions.Users
{
    public static class Mapper
    {
      public static UserDTO ToDto(this User user)
      {
        if(user != null)
        {
            return new UserDTO()
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Password = user.Password
            };
        }
        return null;

      }

      public static User ToUser(this UserDTO userDTO)
      {
        if(userDTO != null)
        {
            return new User
            {
                Id = userDTO.Id,
                FirstName = userDTO.FirstName,
                LastName = userDTO.LastName,
                Email = userDTO.Email,
                Password = userDTO.Password
            };
        }
        return null;
      }

      public static IEnumerable<UserDTO> ToDtos(this IEnumerable<User> users)
      {
        if(users != null)
        { 
               List<UserDTO> usersDtos = new List<UserDTO>();
               foreach(var user in users)
               {
                usersDtos.Add(user.ToDto());
               }

               return usersDtos;
        }
        return null;
      }

      public static IEnumerable<User> ToUsers(this IEnumerable<UserDTO> usersDTOs)
      {
        return usersDTOs?.Select(userDTO => userDTO.ToUser());
      }

    }
}