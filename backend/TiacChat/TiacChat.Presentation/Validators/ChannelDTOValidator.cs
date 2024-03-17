using FluentValidation;
using TiacChat.BAL.DTOs;

namespace TiacChat.Presentation.Validators
{
    public class ChannelDTOValidator : AbstractValidator<ChannelDTO>
    {
        public ChannelDTOValidator()
        {
            RuleFor(channelDTO => channelDTO.Name).NotEmpty().NotNull();
            RuleFor(channelDTO => channelDTO.Visibility).NotNull();
            RuleFor(channelDTO => channelDTO.CreatedBy).NotEmpty().NotNull();
            
        }
    }
}