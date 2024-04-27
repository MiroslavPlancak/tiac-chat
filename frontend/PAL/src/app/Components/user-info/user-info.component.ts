import { Component, OnDestroy} from '@angular/core';
import * as rxjs from 'rxjs';
import { AuthService } from '../../Services/auth.service';
import { UserService } from '../../Services/user.service';
import { NotificationDialogService } from '../../Services/notification-dialog.service';
import { Store } from '@ngrx/store';
import { Users } from '../../state/user/user.action'
import { selectUserById } from '../../state/user/user.selector';
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
  private store: Store
  ) {
    this.store.dispatch(Users.Api.Actions.loadUserByIdStarted({ userId:141}))
     this.store.select(selectUserById).subscribe((res) => console.log(res))
  }

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
