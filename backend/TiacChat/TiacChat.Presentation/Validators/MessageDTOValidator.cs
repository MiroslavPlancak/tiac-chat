using FluentValidation;
using TiacChat.BAL.DTOs;

namespace TiacChat.Presentation.Validators
{
    public class MessageDTOValidator : AbstractValidator<MessageDTO>
    {
      public MessageDTOValidator()
      {
        RuleFor(messageDTO => messageDTO.Body).MaximumLength(500);
        RuleFor(messageDTO => messageDTO.SentFromUserId).NotEmpty().NotNull();
        RuleFor(messageDTO => messageDTO.SentToUserId);
        RuleFor(messageDTO => messageDTO.SentToChannelId).NotEmpty().NotNull();
        RuleFor(messageDTO => messageDTO.Time).NotEmpty().NotNull();

      }
    }
}