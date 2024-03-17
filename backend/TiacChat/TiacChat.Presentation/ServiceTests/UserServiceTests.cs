using FluentAssertions;
using NSubstitute;
using TiacChat.BAL.DTOs;
using TiacChat.BAL.Services;
using TiacChat.DAL.Contracts;
using TiacChat.DAL.Entities;
using TiacChat.BAL.Extensions.Users;

using Xunit;

namespace TiacChat.Presentation.ServiceTests
{
    public class UserServiceTests
    {
        private readonly IUserRepository _userRepository;
        private readonly IUserService _userService;
        private readonly ILogger<User> _logger;

        public UserServiceTests()
        {
            _userRepository = Substitute.For<IUserRepository>();
            _logger = Substitute.For<ILogger<User>>();

            //subject unit test
            _userService = new UserService(_logger, _userRepository);
        }

        [Fact]
        public async Task UserService_GetAllAsync_ReturnUsers()
        {
            // Given
            _userRepository.GetAllAsync().Returns(Task.FromResult(GenerateUsers()));
            // When
            var result = await _userService.GetAllAsync();
            // Then
            result.Count().Should().BeGreaterThanOrEqualTo(3);
        } 

        [Fact]
        public async Task UserService_GetByIdAsync_ReturnUser()
        {
            // Given
            _userRepository.GetByIdAsync(1).Returns(Task.FromResult(CreateUser()));
            // When
            var result = await _userService.GetByIdAsync(1);
            // Then
            result.Id.Should().Be(1);
        }  

        [Fact]
        public async Task UserService_CreateAsync_CreateUser()
        {
            // Given
            var expectedUserDTO = CreateUserDTO();
            _userRepository.CreateAsync(Arg.Any<User>()).Returns(Task.FromResult(expectedUserDTO.ToUser()));
            // When
            var result = await _userService.CreateAsync(CreateUserDTO());
            // Then
            result.Should().BeEquivalentTo(expectedUserDTO);
        }

        [Fact]
        public async Task UserService_UpdateAsync_UpdateUser()
        {
            // Given
            var userTOUpdate = CreateUser();
            var updatedUserDTO= CreateUserDTO();

            _userRepository.UpdateAsync(Arg.Any<User>()).Returns(Task.FromResult(userTOUpdate));
            // When
            var result = await _userService.UpdateAsync(updatedUserDTO);
            // Then
            result.Should().NotBeNull();
            

            result.FirstName.Should().Be(userTOUpdate.FirstName);
            result.LastName.Should().Be(userTOUpdate.LastName);
        }

        [Fact]
        public async Task UserService_DeleteAsync_DeleteUser()
        {
            // Given
            var userToDelete = 1;
            _userRepository.DeleteAsync(Arg.Any<int>()).Returns(Task.FromResult<int?>(userToDelete));
            // When
            var result = await _userService.DeleteAsync(userToDelete);
            // Then
            result.Should().Be(userToDelete);

            
        }
        //Return methods
        private UserDTO CreateUserDTO()
        {
            return new UserDTO(1,"firstNameDTO", "lastNameDTO","emailDTO@gmail.com","passwordDTO");
        }
        private User CreateUser()
        {
            return new User(1,"firstName", "lastName", "email@gmail.com", "password");
        }

        private IEnumerable<User> GenerateUsers()
        {
            return new List<User> 
            {
                new User (1, "firstName1", "lastName1", "email1@gmail.com", "password1"),
                new User (2, "firstName2", "lastName2", "email2@gmail.com", "password2"),
                new User (3, "firstName3", "lastName3", "email3@gmail.com", "password3")
            };
        }
    }

   
}