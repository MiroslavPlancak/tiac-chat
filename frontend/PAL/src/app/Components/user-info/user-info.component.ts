import { Component, OnDestroy} from '@angular/core';
import * as rxjs from 'rxjs';
import { AuthService } from '../../Services/auth.service';
import { UserService } from '../../Services/user.service';
import { NotificationDialogService } from '../../Services/notification-dialog.service';
import { ChatService } from '../../Services/chat.service';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html',
  styleUrl: './user-info.component.css'
})
export class UserInfoComponent implements OnDestroy {

private destroy$ = new rxjs.Subject<void>();
currentUserLogged$ = this.userService.currentUserLogged$

constructor
  (
  private authService: AuthService,
  private userService: UserService,
  private notificationDialog: NotificationDialogService,
  private chatService: ChatService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next(); 
    this.destroy$.complete();
  }




  //methods
  logout() {
    this.notificationDialog.closeAllDialogs()
    this.userService.LogoutUser();
    this.authService.logout();
}
}
