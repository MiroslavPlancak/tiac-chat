using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TiacChat.BAL.DTOs;
using TiacChat.BAL.Services;
using TiacChat.DAL.Contracts;
using TiacChat.DAL.Entities;
using TiacChat.DAL.Entities.Enums;
using TiacChat.Presentation.Validators;
using BCrypt.Net;
using System.Globalization;
namespace TiacChat.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthControllerController : ControllerBase
    {
        private readonly ILogger<Controller> _logger;
        private readonly IJWTManagerRepository _jWTManager;
        private readonly IUserService _services;
        public AuthControllerController(ILogger<Controller> logger,IJWTManagerRepository jWTManager, IUserService service)
        {
            _logger = logger;
             _jWTManager = jWTManager;
              _services = service;
        }

        [AllowAnonymous]
        [HttpPost]
        [Route("register-user")] 
        [ProducesResponseType(typeof(UserDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> RegisterAsync([FromBody]UserDTO userDTO)
        {
            UserDTOValidator validateUserDTO = new UserDTOValidator();
            var validationResult = validateUserDTO.Validate(userDTO);

            if(validationResult.IsValid)
            {
               userDTO.Password = BCrypt.Net.BCrypt.HashPassword(userDTO.Password);

                var newUser = await _services.CreateAsync(userDTO);

                if(newUser != null)
                {
                    return Ok(newUser);
                }
                return BadRequest("User already exists");
            }
            return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage.ToString()));
        }

        [AllowAnonymous]
        [HttpPost]
        [Route("authenticate-user")]
        [ProducesResponseType(typeof(Tokens), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> AuthenticateAsync(UserLogin userLogin)
        {
            
            var user = await _services.GetUserByEmailAsync(userLogin.Email);

            if(user == null)
            {
                return BadRequest("Invalid username/password");
            }

            //BCrypt
         

            bool passwordMatch = BCrypt.Net.BCrypt.Verify(userLogin.Password,user.Password);

            if(!passwordMatch)
            {
                 return BadRequest("Invalid username/password");
            }
            
           
            //does not get generated
            var token = await _jWTManager.GenerateToken(user.Id, user.Email);

            if(token == null)
            {
                return Unauthorized("Invalid attempt");
            }
            
            var checkIfRefreshTokenExists = await _services.checkIfRefreshTokenExistsByUserIdAsync(user.Id);
            if(checkIfRefreshTokenExists == null)
            {
                UserRefreshToken newUserRefreshToken = new UserRefreshToken
                {
                    RefreshToken = token.RefreshToken,
                    UserId = user.Id,
                    //ExpirationDate = DateTime.Now.AddDays(7)
                    ExpirationDate = DateTime.Now.AddMinutes(1)
                };
                await _services.AddUserRefreshTokensAsync(newUserRefreshToken);
            }else if(checkIfRefreshTokenExists.RefreshToken != null){
                token.RefreshToken = checkIfRefreshTokenExists.RefreshToken;
            }

            return Ok(token);
        }

        [AllowAnonymous]
        [HttpPost]
        [Route("refresh-token")]
        [ProducesResponseType(typeof(Tokens), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Refresh(Tokens oldTokens)
        {
            var principal = _jWTManager.GetPrincipalFromExpiredToken(oldTokens.AccessToken);
            var email = principal.Identity?.Name;
            var user = await _services.GetUserByEmailAsync(email);

            if(user == null)
            {
                return BadRequest("Invalid refresh token");
            }

            var savedRefreshToken = await _services.GetSavedRefreshTokensAsync(user.Id, oldTokens.RefreshToken);
            if(savedRefreshToken == null || savedRefreshToken.RefreshToken != oldTokens.RefreshToken)
            {
                return Unauthorized("Your refresh token has expired, please login again.");
            }
            //check if the refresh token has expired logic  
            DateTime currentTime = DateTime.Now;
           
             Console.WriteLine("The current time is:" + currentTime);
            
             Console.WriteLine("refresh token expiration time is:" + savedRefreshToken.ExpirationDate);
             Console.WriteLine("state of refresh token:"+ savedRefreshToken.IsActive);

            if (currentTime > savedRefreshToken.ExpirationDate)
            {
                
                Console.WriteLine("refresh token has expired!!!!");
                if (savedRefreshToken.IsActive)
                {
                    await _jWTManager.flagExpiredRefreshTokenAsInactive(savedRefreshToken.Id);
                }
                await _jWTManager.deleteExpiredRefreshToken(savedRefreshToken.Id);
            }

            //check if the refresh token has expired logic
            var newJwtToken = await _jWTManager.GenerateRefreshToken(user.Id, email); 
            
            if(newJwtToken == null)
            {
                return Unauthorized("Invalid attempt2!");
            }

            // this needs to be reworked 
            UserRefreshToken newUserRefreshToken = new UserRefreshToken
            {
                RefreshToken = newJwtToken.RefreshToken,
                UserId = user.Id,
                ExpirationDate = DateTime.Now.AddDays(7)
            };

        //          _services.DeleteUserRefreshToken(user.Id, oldTokens.RefreshToken);
        //   await  _services.AddUserRefreshTokensAsync(newUserRefreshToken);

           
           
           return Ok(newJwtToken);
        }
    }

}