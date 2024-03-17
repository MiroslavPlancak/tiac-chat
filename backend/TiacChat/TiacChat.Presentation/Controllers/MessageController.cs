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
using TiacChat.DAL.Entities;
using TiacChat.Presentation.Validators;

namespace TiacChat.Presentation.Controllers
{
    [Route("api/messages")]
    [ApiController]
    public class MessagesController : ControllerBase
    {
        private readonly IMessageService _services;
        public MessagesController(IMessageService services)
        {
            _services = services;
        }

        [HttpGet("getAll")]
        [ProducesResponseType(typeof(IEnumerable<MessageDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetAllMessages()
        {
            var messagesDTO = await _services.GetAllAsync();
            if(messagesDTO != null)
            {
                return Ok(messagesDTO);
            }
            return NotFound("No messages found.");
           
        }

        [HttpGet("{messageId}")]
        [ProducesResponseType(typeof(MessageDTO),StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetMessageById(int messageId)
        {
            var messageDTO = await _services.GetByIdAsync(messageId);
            if(messageDTO != null)
            {
                return Ok(messageDTO);
            } 
            return NotFound($"Message with an ID of: {messageId} was not found.");
        }

        [HttpGet("getMessagesByChannelId")]
        [ProducesResponseType(typeof(MessageDTO),StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetMessagesByChannelId([FromQuery]int channelId)
        {
           var publicMessagesDTOByChannelId = await _services.GetPublicMessagesByChannelIdAsync(channelId);
           if(publicMessagesDTOByChannelId != null)
           {
            return Ok(publicMessagesDTOByChannelId);
           }
           return NotFound($"Messages for the selected channel {channelId} were not found.");
        }

        [HttpGet("getPaginatedPublicChannelMessages")]
        [ProducesResponseType(typeof(MessageDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetPaginatedPublicChannelMessages
        ([FromQuery] int channelId, [FromQuery] int startIndex, [FromQuery] int endIndex)
        {
          var paginatedPublicChannelMessages = await _services
          .GetPaginatedPublicChannelMessagesByIdAsync(channelId, startIndex, endIndex);
          
          if(paginatedPublicChannelMessages != null)
          {
            return Ok(paginatedPublicChannelMessages);
          } 
          return NotFound
          ($"Messages for the selected channel {channelId}, with start index {startIndex} and end index {endIndex} were not found.");
        }

        [HttpGet()]
        [ProducesResponseType(typeof(MessageDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetPrivateMessages([FromQuery]int senderId, [FromQuery]int receiverId)
        {
            var privateMessageDTO = await _services.GetPrivateMessagesByIdsAsync(senderId, receiverId);
            if(privateMessageDTO != null)
            {
                return Ok(privateMessageDTO);
            }
            return NotFound("No private messages were found.");
        }

        [HttpGet("getPaginatedPrivateMessages")]
        [ProducesResponseType(typeof(MessageDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetPaginatedPrivateMessages
        ([FromQuery] int senderId, [FromQuery] int receiverId, [FromQuery] int startIndex, [FromQuery] int endIndex)
        {
            var paginatedPrivateMessages = await _services.GetPaginatedPrivateMessagesByIdsAsync(senderId, receiverId, startIndex, endIndex);
            if (paginatedPrivateMessages != null)
            {
                return Ok(paginatedPrivateMessages);
            }
            return NotFound("No paginated private messages were found.");
        }

        [HttpGet("getLatestNumberOfPrivateMessages")]
        [ProducesResponseType(typeof(int),StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetLatestNumberOfPrivateMessages([FromQuery] int senderId, [FromQuery] int receiverId)
        {
            var numberOfPrivateMessages = await _services.GetLatestNumberOfPrivateMessagesByIdsAsync(senderId,receiverId);
            if(numberOfPrivateMessages != 0)
            {
                return Ok(numberOfPrivateMessages);
            }
            return NotFound("There are no private messages between these two users.");
        }
        
        [HttpGet("getLatestNumberOfPublicChannelMessages")]
        [ProducesResponseType(typeof(int),StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetLatestNumberOfPublicChannelMessages([FromQuery] int channelId)
        {
            var numberOfPublicChannelMessages = await _services.GetLatestNumberOfPublicMessagesByChannelIdAsync(channelId);
            if(numberOfPublicChannelMessages != 0)
            {
                return Ok(numberOfPublicChannelMessages);
            }

            return NotFound("There were no public messages found in this public channel.");
        }

        [HttpPost]
        [ProducesResponseType(typeof(MessageDTO),StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateMessage([FromBody] MessageDTO messageDTO)
        {   
            MessageDTOValidator validateMessage = new MessageDTOValidator();
            var validationResult = validateMessage.Validate(messageDTO);

            if(validationResult.IsValid)
            {
                var newMessageDTO = await _services.CreateAsync(messageDTO);

                if(newMessageDTO != null)
                {
                    return Ok(newMessageDTO);
                }
                
            }
            return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage.ToString()));
        }

        [HttpPut]
        [ProducesResponseType(typeof(MessageDTO),StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateMessage([FromBody] MessageDTO messageDTO)
        {
            MessageDTOValidator validateMessage = new MessageDTOValidator();
            var validationResult = validateMessage.Validate(messageDTO);

            if(validationResult.IsValid)
            {
                var updateMessage = await _services.UpdateAsync(messageDTO);

                if(updateMessage != null)
                {
                    return Ok(messageDTO);
                }
                return NotFound("Could not update the message.");
            }

            return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage.ToString()));
        }

        [HttpDelete]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteMessage(int messageId)
        {
            var deleteMessage = await _services.DeleteAsync(messageId);
            
            if(deleteMessage != null)
            {
                return Ok(messageId);
            }
            return NotFound($"Message with an ID of {messageId} was not found.");
        }
    }

}