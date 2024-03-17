using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TiacChat.BAL.DTOs;
using TiacChat.BAL.Services;
using TiacChat.Presentation.Validators;

namespace TiacChat.Presentation.Controllers
{
    [Route("api/channels")]
    [ApiController]
    public class ChannelController : ControllerBase
    {
        private readonly IChannelService _services;
        public ChannelController(IChannelService services)
        {
            _services = services;
        }

        [HttpGet("getAll")]
        [ProducesResponseType(typeof(IEnumerable<ChannelDTO>),StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetAllChannels()
        {
            var channelsDTO = await _services.GetAllAsync();
            if(channelsDTO != null)
            {
                return Ok(channelsDTO);
            }
            return NotFound("No channels found");
        }

        [HttpGet("privateChannels")]
        [ProducesResponseType(typeof(IEnumerable<ChannelDTO>),StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetPrivateChannelsByUserId(int userId)
        {
            var channelDTO = await _services.GetPrivateChannelsByUserIdAsync(userId);

            if(channelDTO != null)
            {
                return Ok(channelDTO);
            }
            return NotFound($"Channel with an ID of {userId} was not found.");
        }

        [HttpPost("userChannel")]
        [ProducesResponseType(typeof(UserChannelDTO),StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> AddUserToPrivateChannel([FromBody] UserChannelDTO userChannel)
        {
            var newUserChannel = await _services.AddUserToPrivateConversation(userChannel);

            if(newUserChannel !=null){
                return Ok(newUserChannel);
            }
            return BadRequest();
        }

        [HttpDelete("userchannel")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteUserChannel(int userId, int channelId)
        {
            var deleteChannel = await _services.DeleteUserChannelByIdsAsync(userId,channelId);

            if(deleteChannel != null)
            {
                return Ok(userId);
            }
            return NotFound($"Channel with the ID of {userId} was not found.");
        }

        [HttpGet("participants")]
        [ProducesResponseType(typeof(UserChannelDTO),StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetListOfPrivateConversationParticipants(int channelId)
        {
            var listOfParticipants = await _services.GetParticipantsOfPrivateChannelAsync(channelId);
            if(listOfParticipants !=null)
            {
                return Ok(listOfParticipants);
            }
            return NotFound();
        }

        [HttpGet]
        [ProducesResponseType(typeof(ChannelDTO),StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetChannelById(int channelId)
        {
            var channelDTO = await _services.GetByIdAsync(channelId);

            if(channelDTO != null)
            {
                return Ok(channelDTO);
            }
            return NotFound($"Channel with an ID of {channelId} was not found.");
        }

        [HttpPost]
        [ProducesResponseType(typeof(UserDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateChannel([FromBody] ChannelDTO channelDTO)
        {
            ChannelDTOValidator validateChannel = new ChannelDTOValidator();
            var validationResult = validateChannel.Validate(channelDTO);

            if(validationResult.IsValid)
            {
                var newChannel = await _services.CreateAsync(channelDTO);

                if(newChannel != null)
                {
                    return Ok(newChannel);
                }
                return BadRequest("Channel already exists.");
            }
            return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage.ToString()));
        }

        [HttpPut]
        [ProducesResponseType(typeof(UserDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateChannel([FromBody] ChannelDTO channelDTO)
        {
            ChannelDTOValidator validateChannel = new ChannelDTOValidator();
            var validationResult = validateChannel.Validate(channelDTO);

            if(validationResult.IsValid)
            {
                var updateChannel = await _services.UpdateAsync(channelDTO);
                if(updateChannel !=null)
                {
                 return Ok(updateChannel);
                }
                
            }   
            return BadRequest(validationResult.Errors.Select(e =>e.ErrorMessage.ToString()));         
        }

        [HttpDelete]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteChannel(int channelId)
        {
            var deleteChannel = await _services.DeleteAsync(channelId);

            if(deleteChannel != null)
            {
                return Ok(channelId);
            }
            return NotFound($"Channel with the ID of {channelId} was not found.");
        }
    }

}