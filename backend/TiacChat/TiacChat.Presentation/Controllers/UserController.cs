using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TiacChat.BAL.DTOs;
using TiacChat.BAL.Services;
using TiacChat.DAL.Contracts;
using TiacChat.DAL.Entities;
using TiacChat.DAL.Entities.Enums;
using TiacChat.Presentation.Hubs;
using TiacChat.Presentation.Validators;

namespace TiacChat.Presentation.Controllers
{
    //[Authorize]
    [Route("api/users")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IJWTManagerRepository _jWTManager;
        private readonly IUserService _services;
      
        public UserController(IUserService service,IJWTManagerRepository jWTManager)
        {
            _jWTManager = jWTManager;
            _services = service;
            
        }

        

        [HttpGet("getAll")]
        [ProducesResponseType(typeof(IEnumerable<UserDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetUsers()
        {
            var usersDTO = await _services.GetAllAsync();
            if(usersDTO != null)
            {
                return Ok(usersDTO);
            }  
              return NotFound("No users found.");      
        }

        [HttpGet("{userId}")]
        [ProducesResponseType(typeof(UserDTO),StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetUserById(int userId)
        {
            var user = await _services.GetByIdAsync(userId);
            if(user != null)
            {
                return Ok(user);
            }
             return NotFound($"User with an ID of: {userId} was not found.");

        }

        [HttpPost]
        [ProducesResponseType(typeof(UserDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateUser([FromBody] UserDTO userDTO)
        {
            UserDTOValidator validateUser = new UserDTOValidator();
            var validationResult = validateUser.Validate(userDTO);

            if(validationResult.IsValid)
            {
                var newUser = await _services.CreateAsync(userDTO);

                if(newUser != null)
                {
                    
                    return Ok(newUser);
                }
                 return BadRequest("User already exists.");
            }
             return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage.ToString()));
        }

        [HttpPut]
        [ProducesResponseType(typeof(UserDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateUser([FromBody] UserDTO userDTO)
        {
            UserDTOValidator validateUser = new UserDTOValidator(); 

            var validationResult = validateUser.Validate(userDTO);

            if(validationResult.IsValid)
            {
                var updateUser = await _services.UpdateAsync(userDTO);

                if(updateUser != null)
                {
                    return Ok(updateUser);
                }
                return BadRequest("Could not update the user.");
            } 

            return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage.ToString()));          
        }

        [HttpDelete("{userId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteUser(int userId)
        {
            var deleteUser = await _services.DeleteAsync(userId);
            if(deleteUser != null)
            {
                return Ok(userId);
            }
            return NotFound($"User with the ID of {userId} was not found.");
        }

    }

}