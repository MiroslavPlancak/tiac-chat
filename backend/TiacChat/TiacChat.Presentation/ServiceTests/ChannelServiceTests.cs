
using FluentAssertions;
using NSubstitute;
using TiacChat.BAL.DTOs;
using TiacChat.BAL.Extensions.Channels;
using TiacChat.BAL.Services;
using TiacChat.DAL.Contracts;
using TiacChat.DAL.Entities;
using Xunit;

namespace TiacChat.Presentation.ServiceTests
{
    public class ChannelServiceTests
    {
        private readonly IChannelRepository _channelRepository;
        private readonly IChannelService _channelService;
        private readonly ILogger<Channel> _logger;
        private readonly IUserChannelRepository _userChannelRepository;
        public ChannelServiceTests()
        {
          _channelRepository = Substitute.For<IChannelRepository>();
          _logger = Substitute.For<ILogger<Channel>>();
          _userChannelRepository = Substitute.For<IUserChannelRepository>();

          _channelService = new ChannelServices(_logger,_channelRepository,_userChannelRepository);   
        }

        [Fact]
        public async Task ChannelService_GetAllAsync_ReturnChannels()
        {
            // Given
            _channelRepository.GetAllAsync().Returns(Task.FromResult(GeneratedChannel()));
            // When
            var result = await _channelRepository.GetAllAsync();
            // Then
            result.Count().Should().BeGreaterThanOrEqualTo(3);
        }

        [Fact]
        public async Task ChannelService_GetByIdAsync_ReturnChannel()
        {
            // Given
            var channelId =1;
            // When
            _channelRepository.GetByIdAsync(channelId).Returns(Task.FromResult(CreateChannel()));
            // Then
            var result = await _channelService.GetByIdAsync(channelId);
            result.Id.Should().Be(1);
        }

        [Fact]
        public async Task ChannelService_CreateAsync_CreateChannel()
        {
            // Given
            var expectedChannelDTO = new ChannelDTO();
            _channelRepository.CreateAsync(Arg.Any<Channel>()).Returns(Task.FromResult(expectedChannelDTO.ToChannel()));
            // When
            var result = await _channelService.CreateAsync(CreateChannelDTO());
            // Then
            result.Should().BeEquivalentTo(expectedChannelDTO);
        }

        [Fact]
        public async Task ChannelService_UpdateAsync_UpdateChannel ()
        {
            // Given
            var channelToUpdate = CreateChannel();
            var updateChannelDTO = CreateChannelDTO();
            _channelRepository.UpdateAsync(Arg.Any<Channel>()).Returns(Task.FromResult(channelToUpdate));
            // When
            var result = await _channelService.UpdateAsync(updateChannelDTO);
            // Then
            result.Should().NotBe(null);
            result.Name.Should().Be(channelToUpdate.Name);
        }

        [Fact]
        public async void ChannelService_DeleteAsync_DeleteChannel()
        {
            // Given
            var channelToDelete = 1;
            _channelRepository.DeleteAsync(Arg.Any<int>()).Returns(Task.FromResult<int?>(channelToDelete));
            // When
            var result =  await _channelService.DeleteAsync(channelToDelete);
            // Then
            result.Should().Be(channelToDelete);
        }
        private Channel CreateChannel()
        {
            return new Channel(1,"channel name",0,1);
        }

        private ChannelDTO CreateChannelDTO()
        {
            return new ChannelDTO(1,"channel name DTO",0,1);
        }

        private IEnumerable<Channel> GeneratedChannel()
        {
            return new List<Channel>
            {
                new Channel(1,"channel name1",0,1),
                new Channel(2,"channel name2",0,1),
                new Channel(3,"channel name3",0,1),
            };
        }
    }
}