import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../Services/auth.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { RegisterUserComponent } from '../register-user/register-user.component';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {


  loginForm: FormGroup;
  errorHappened= false;
  errorMessage = '';
  registeredUser: any

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private matDialog: MatDialog,
   // private chatService: ChatService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    })
  }

  onSubmit() {

    if (this.loginForm?.valid) {
      const email = this.loginForm.get('email')?.value;
      const password = this.loginForm.get('password')?.value;

      console.log('Email', email);
      console.log('Password', password);

      this.authService.login(email, password).subscribe({

        next: response => {
        
          console.log("AuthenticateAsync responds with:", response);
          
          //this.authService.setLoggedInUser(response); 
         // this.router.navigate(['/chatMat']);
          
        },
        error: error => {
          console.error(error);
          this.errorHappened = true;
          this.errorMessage = error.error;
        },
        complete: () => {
          this.loginForm.reset();
          console.log("Login successful");
        }
      });
    }
  }

  openRegistrationDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = true;

    const dialogData = {
      //data to send
    }

    dialogConfig.data = dialogData;
    const dialogRef = this.matDialog.open(RegisterUserComponent, dialogConfig);
    
    dialogRef.componentInstance.userCreated.subscribe((registeredUserDetails:any)=>{
      console.log(`created user over mat dialog result: `,registeredUserDetails)
      this.registeredUser = registeredUserDetails;
      // this.chatService.addUserToOnlineList(userCreatedDetails)
    })
      
    // })
  }

}
