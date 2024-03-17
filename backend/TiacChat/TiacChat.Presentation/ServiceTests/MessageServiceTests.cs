using FluentAssertions;
using TiacChat.DAL.Entities;
using NSubstitute;
using TiacChat.BAL.Extensions.Messages;
using TiacChat.BAL.Services;
using TiacChat.DAL.Contracts;
using Xunit;
using TiacChat.BAL.DTOs;

namespace TiacChat.Presentation.ServiceTests
{
    public class MessageServiceTests
    {
        private readonly IMessageRepository _messageRepository;
        private readonly IMessageService _messageService;
        private readonly ILogger<Message> _logger;

        public MessageServiceTests()
        {
            _messageRepository = Substitute.For<IMessageRepository>();
            _logger = Substitute.For<ILogger<Message>>();
            
            //subject tested
            _messageService = new MessageService(_logger,_messageRepository);
        }

        [Fact]
        public async Task MessageService_GetAllAsync_ReturnMessages()
        {
            // Given
            _messageRepository.GetAllAsync().Returns(Task.FromResult(GenerateMessages()));
            // When
            var result = await _messageService.GetAllAsync();
            // Then
            result.Count().Should().BeGreaterThanOrEqualTo(3);
        }

        [Fact]
        public async Task MessageService_GetByIdAsync_ReturnMessage()
        {
            var messageId =1;
            // Given
            _messageRepository.GetByIdAsync(messageId).Returns(Task.FromResult(CreateMessage()));
            // When
            var result = await _messageService.GetByIdAsync(messageId);
            // Then
            result.Id.Should().Be(1);
        }

        [Fact]
        public async Task MessageService_CreateAsync_CreateMessage()
        {
            // Given
            var expectedMessageDTO = new MessageDTO();
            _messageRepository.CreateAsync(Arg.Any<Message>()).Returns(Task.FromResult(expectedMessageDTO.ToMessage()));
            // When
            var result = await _messageService.CreateAsync(CreateMessageDTO());
            // Then
            result.Should().BeEquivalentTo(expectedMessageDTO);
        }
        [Fact]
        public async  Task  MessageService_UpdateAsync_UpdateMessage()
        {
            // Given
            var messageToUpdate = CreateMessage();
            var updatedMessageDTO = CreateMessageDTO();
            _messageRepository.UpdateAsync(Arg.Any<Message>()).Returns(Task.FromResult(messageToUpdate));
            // When
            var result = await _messageService.UpdateAsync(updatedMessageDTO);
            // Then
            result.Should().NotBe(null);
            result.Body.Should().Be(messageToUpdate.Body);
        }

        [Fact]
        public async Task MessageService_DeleteAsync_DeleteMessage()
        {
            // Given
            var messageToDelete = 1;
            _messageRepository.DeleteAsync(Arg.Any<int>()).Returns(Task.FromResult<int?>(messageToDelete));
            // When
            var result = await _messageService.DeleteAsync(messageToDelete);
            // Then
            result.Should().Be(messageToDelete);
        }
        //Return methods
        private Message CreateMessage()
        {
            return new Message (1, "message body1", 1, 2, 3, DateTime.Now, false);
        }

        private MessageDTO CreateMessageDTO()
        {
            return new MessageDTO (1, "message body1 DTO", 1, 2, 3, DateTime.Now,false);
        }
        private IEnumerable<Message> GenerateMessages()
        {
           
            return new List<Message> 
            {
                new Message(1,"message body1", 1, 2, 3, DateTime.Now,false),
                new Message(2,"messsage body2", 1, 2, 3, DateTime.Now,false),
                new Message(3,"messsage body3", 1, 2, 3, DateTime.Now,false)
                
            };
        }
    }

   
}