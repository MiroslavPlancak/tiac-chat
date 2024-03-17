using FluentValidation;
using TiacChat.BAL.DTOs;

namespace TiacChat.Presentation.Validators
{
    public class UserDTOValidator : AbstractValidator<UserDTO>
    {
        public UserDTOValidator()
        {
            RuleFor(userDTO => userDTO.FirstName).NotNull().NotEmpty().Length(3,25);
            RuleFor(userDTO => userDTO.LastName).NotNull().NotEmpty().Length(3,25);
            RuleFor(userDTO => userDTO.Email).NotNull().NotEmpty().MaximumLength(50)
              .EmailAddress()
                .Matches(@"^([\w\.\-]+)@([\w\-]+)((\.(\w){2,3})+)$")
                 .WithMessage("Invalid email");
            RuleFor(userDTO => userDTO.Password).NotNull().NotEmpty().Length(1,100);

        }
    }
}