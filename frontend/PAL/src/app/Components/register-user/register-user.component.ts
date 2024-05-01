import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CreateChannelComponent } from '../create-channel/create-channel.component';
import { UserService } from '../../Services/user.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../Services/auth.service';
import * as rxjs from 'rxjs';

export interface UserRegister {
  id: number,
  firstName: string,
  lastName: string,
  email: string,
  password: string
}

@Component({
  selector: 'app-register-user',
  templateUrl: './register-user.component.html',
  styleUrl: './register-user.component.css'
})
export class RegisterUserComponent implements OnInit {



  @Output() userCreated = new EventEmitter<any>();


  userForm!: FormGroup;
  passwordMismatch = false;
  newUserCreated = false;
  errorHappened = false;
  errorMessage = '';

  newUserFirstName!: string;
  newUserLastName!: string;
  newUserEmail!: string;
  newUserPassword!: string;



  constructor(

    private dialogRef: MatDialogRef<CreateChannelComponent>,
    @Inject(MAT_DIALOG_DATA) public matData: any,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private userService: UserService
  ) {


  }
  ngOnInit(): void {
    this.userForm = this.formBuilder.group({
      firstName: ["", [Validators.required, Validators.minLength(3), Validators.maxLength(25)]],
      lastName: ["", [Validators.required, Validators.minLength(3), Validators.maxLength(25)]],
      email: ["", [Validators.required, Validators.maxLength(50), Validators.email, Validators.pattern(/^([\w\.\-]+)@([\w\-]+)((\.(\w){2,3})+)$/)]],
      password: ["", [Validators.required, Validators.maxLength(100)]],

    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {

      const user: UserRegister = {
        id: 0,
        firstName: this.userForm.value.firstName,
        lastName: this.userForm.value.lastName,
        email: this.userForm.value.email,
        password: this.userForm.value.password
      }

      this.authService.createNewUser(user).pipe(
        rxjs.switchMap(newUser => {
          const registeredUserInfo = {
            id: newUser.id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            password: newUser.password
          }
          this.newUserFirstName = newUser.firstName,
            this.newUserLastName = newUser.lastName,
            this.newUserEmail = newUser.email,
            this.newUserPassword = newUser.password

          this.userCreated.emit(registeredUserInfo)
          return rxjs.EMPTY;
        }),
        rxjs.tap((error: any) => {
          if (error.status === 400) {
            this.errorHappened = true;
            this.newUserCreated = false;
            console.log(`Back end error fired.`, error)
            this.errorMessage = error.error;
          }
        }),
        // rxjs.switchMap(() => {
        //   //need to place ngrx load all logic
        //  // return this.userService.getAllUsersBS$()
        //  return rxjs.EMPTY;
        // })
        
      ).subscribe(() =>
        this.authService.accessTokenExpirationTimer.next(300)
      )
      this.newUserCreated = true;
      this.errorHappened = false;

    }
  }

  close() {
    this.dialogRef.close();
  }
}
