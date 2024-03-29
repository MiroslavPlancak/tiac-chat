using FluentValidation;
using TiacChat.BAL.DTOs;

namespace TiacChat.Presentation.Validators
{
    public class MessageDTOValidator : AbstractValidator<MessageDTO>
    {
      public MessageDTOValidator()
      {
        RuleFor(messageDTO => messageDTO.Body).MaximumLength(500);
        RuleFor(messageDTO => messageDTO.SentFromUserId);
        RuleFor(messageDTO => messageDTO.SentToUserId).NotEmpty().NotNull();
        RuleFor(messageDTO => messageDTO.SentToChannelId).NotEmpty().NotNull();
        RuleFor(messageDTO => messageDTO.Time).NotEmpty().NotNull();

      }
    }
}