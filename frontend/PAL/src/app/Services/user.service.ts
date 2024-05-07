import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';
import { BehaviorSubject, Observable, Subject, tap, throwError } from 'rxjs';
import * as rxjs from 'rxjs';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ChannelService } from './channel.service';
import { AddUserToPrivateChannelComponent } from '../Components/add-user-to-private-channel/add-user-to-private-channel.component';
import { ConnectionService } from './connection.service';
import { NotificationDialogService } from './notification-dialog.service';
import { User } from '../Models/user.model';
import { Store } from '@ngrx/store';
import { Users } from '../state/user/user.action'
import { selectAllUsers, selectUserById } from '../state/user/user.selector';


@Injectable({
  providedIn: 'root'
})
export class UserService implements OnDestroy {


  private destroy$ = new rxjs.Subject<void>();
  public allUsersNgRx$ = new Observable<User[]>
  public onlineUserIdsNgRx$ = new Observable<number[]>
  isOnline: boolean = false

  writingTo = new BehaviorSubject<string>("@public_root")
  fullName = ""
  writeToChannelName = new BehaviorSubject<string>("")

  public onlineUserIds$ = new rxjs.BehaviorSubject<number[]>([]);


  currentUserId$ = this.authService.userId$;

  private apiUrl = "http://localhost:5008/api/users/";

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private chanelService: ChannelService,
    private matDialog: MatDialog,
    private connectionService: ConnectionService,
    private dialogService: NotificationDialogService,
    private store: Store
  ) {

    


    this.authService.loggedOut$.subscribe((isLoggedOut) => {
      if (isLoggedOut) {
        this.connectionService.hubConnection.stop()
        this.destroy$.next()
        this.destroy$.complete()
      }
    })
    /////On hub methods/////

    //user connected
    this.connectionService.hubConnection.on("YourConnectionId", (connection: Record<string, string>, userId: number, fullName: string) => {

      console.log(`new connection established:${JSON.stringify(connection)}`);

      const userIds = Object.keys(connection).map(strUserId => +strUserId);

      this.onlineUserIds$.next(userIds);

      //ngRx load all users after the connection has been established
      this.store.dispatch(Users.Api.Actions.loadAllUsersStarted())
      this.allUsersNgRx$ = this.store.select(selectAllUsers)

      this.allUsersNgRx$.pipe(rxjs.skip(1), rxjs.take(1)).subscribe(()=> 
        this.store.dispatch(Users.Hub.Actions.loadConnectedUsersStarted({ connectedUserIds: userIds }))
      )
      

      if (this.currentUserId$.getValue() !== userId) {

        this.dialogService.openOnlineNotification(
          `${fullName} just came online.`,
          ``,
          ``,
          { top: `0%`, left: `80%` },
          3000
        )
      }

    })

    //user disconnected
    this.connectionService.hubConnection.on('UserDisconnected', (connections, userId, fullName) => {
      const userIds = Object.keys(connections).map(userId => +userId)
      this.onlineUserIds$.next(userIds);

      //ngRx load connected users 
  
      this.onlineUserIds$.subscribe((onlineUserIds) => {
        this.store.dispatch(Users.Hub.Actions.loadConnectedUsersStarted({ connectedUserIds: onlineUserIds }))
      })

      //console.log(`onlineUserIds$ value disconnected:`, this.onlineUserIds$.value)
      if (this.currentUserId$.getValue() !== userId) {

        this.dialogService.openOnlineNotification(
          `${fullName} just went offline.`,
          ``,
          ``,
          { top: `0%`, left: `80%` },
          3000
        )
      }

    })

    /////On hub methods/////

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /////HTTP endpoint methods/////
  //1
  getById(userId: number): Observable<User> {
    if (!userId) { throw new Error() }
    const url = `${this.apiUrl}${userId}`;
    return this.http.get<any>(url).pipe(
      rxjs.catchError((error: HttpErrorResponse) => {
        return rxjs.throwError(() => new Error(error.message))
      })
    )
  }
  //1
  getAllUsers(): Observable<User[]> {
    const url = `${this.apiUrl}getAll`
    return this.http.get<User[]>(url);
  }

  /////HTTP endpoint methods/////

  /////Service methods/////

  //ngRx implementation 

  // get all users obs$ (old implementation)
  public allUsers$ = this.store.select(selectAllUsers).pipe(

    rxjs.takeUntil(this.destroy$)
  );


  // add user to private channel helper method()
  addUserToPrivateChannel(channelId: number) {

    const dialogConfig = new MatDialogConfig()
    dialogConfig.disableClose = false
    dialogConfig.autoFocus = true

    console.log(`this.chanelService.isCurrentUserOwner$.value`, this.chanelService.isCurrentUserOwner$.value)
    console.log(`privateChannelId`, this.chanelService.SelectedChannel$.value)
    const dialogData = {
      privateChannelId: this.chanelService.SelectedChannel$.value,
      isOwner: this.chanelService.isCurrentUserOwner$.value
    }

    dialogConfig.data = dialogData;
    const dialogRef = this.matDialog.open(AddUserToPrivateChannelComponent, dialogConfig);


  }

  /////Service methods/////

  /////Invoke hub methods/////

  //kick user from private conversation 
  public kickUser = (userId: number, channelId: number) => {
    this.connectionService.hubConnection?.invoke("RemoveUserFromPrivateConversation", userId, channelId)
      .catch(err => console.log(err))
    console.log('kicked user info:')
  }

  //invite user to private conversation
  public inviteUser = (userId: number, channelId: number) => {
    this.connectionService.hubConnection?.invoke("AddUserToPrivateConversation", userId, channelId)
      .catch(err => console.log(err))
    console.log('added user info:')
  }

  //logout user
  public LogoutUser = () => {
    this.connectionService.hubConnection?.invoke("LogoutUserAsync").catch(err => console.log(err));
  }
  /////Invoke hub methods/////
}
export { User };

