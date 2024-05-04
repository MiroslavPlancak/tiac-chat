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

      this.allUsersNgRx$.pipe(rxjs.skip(1), rxjs.take(1)).subscribe()
      //ng Rx load connected user
      this.store.dispatch(Users.Hub.Actions.loadConnectedUserStarted({ connectedUserId: userId }))


      rxjs.combineLatest([this.allUsersNgRx$, this.onlineUserIds$]).pipe(
        rxjs.filter(([users, ids]) => users.length > 0 && ids.length > 0),
        rxjs.tap(([users, ids]) => this.store.dispatch(Users.Hub.Actions.loadConnectedUsersStarted({ connectedUserIds: ids }))),
        rxjs.take(1)
      ).subscribe(([users, ids]) => {})


      //ngRx load connected users 
      //  setTimeout(() => {
      //   this.store.dispatch(Users.Hub.Actions.loadConnectedUserStarted({ connectedUserIds: userIds }))

      //  }, 10);

      // this.onlineUserIds$.subscribe((onlineUserIds) => {
      //   console.log(`Behavior Subject<number[]> emits:`, onlineUserIds)
      //   //this.store.dispatch(Users.Hub.Actions.loadConnectedUsersStarted({ connectedUserIds: onlineUserIds }))
      // })


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
      //  setTimeout(() => {
      //   this.store.dispatch(Users.Hub.Actions.loadConnectedUserStarted({ connectedUserIds: userIds }))

      //  }, 10);
      this.onlineUserIds$.subscribe((onlineUserIds) => {
        console.log(`disconnected user fired`, onlineUserIds)
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

  // filter self out of all users obs$
  public onlineUserIdsWithoutSelf$ = rxjs.combineLatest([
    this.onlineUserIds$.pipe(rxjs.takeUntil(this.destroy$)),
    this.authService.userId$.pipe(rxjs.takeUntil(this.destroy$))
  ])
    .pipe(
      rxjs.map(([onlineUserIds, currentUserId]) => onlineUserIds.filter(onlineUserId => onlineUserId !== currentUserId)),
      rxjs.takeUntil(this.destroy$)
    )

  // online users obs$
  public onlineUsers$ = rxjs.combineLatest([
    this.onlineUserIdsWithoutSelf$,
    this.store.select(selectAllUsers),
  ]).pipe(
    rxjs.map(([onlineUserIds, allUsers]) => {
      return allUsers.filter(user => onlineUserIds.includes(user.id))
    }),
    //   rxjs.tap(res => console.log(`onlineUsers$/chat.service.ts:`,res)),
    rxjs.takeUntil(this.destroy$)
  )

  // offline users obs$
  public offlineUsers$ = rxjs.combineLatest([
    //if offline list is not filtering correctly its is due to this change, return -onlineUserIdsWithoutSelf$
    this.onlineUserIds$,
    this.store.select(selectAllUsers),
  ]).pipe(
    rxjs.map(([onlineUserIds, allUsers]) => {
      return allUsers.filter(user => !onlineUserIds.includes(user.id))
    }),
    rxjs.takeUntil(this.destroy$)
  )

  // current user logged details obs$
  currentUserLogged$ = this.authService.userId$.pipe(
    rxjs.filter(userId => userId != null),
    rxjs.distinctUntilChanged(),
    rxjs.switchMap(userid => {
      const userID = userid as number
      this.store.dispatch(Users.Api.Actions.loadUserByIdStarted({ userId: userID }))
      return this.store.select(selectUserById).pipe(
        rxjs.filter(users => users.some(user => user.id === userID)),
        rxjs.map(users => {
          let currentUser = users.find(user => user.id === userID)
          return currentUser
        })
      )
      //old implementation
      //return this.getById(userid as number);
    }),
    rxjs.map(user => {
      return {
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email
      }
    }),
    rxjs.takeUntil(this.destroy$)
  )
  // current user name obs$
  currentUserName$ = this.authService.userId$.pipe(
    rxjs.filter((userId: any) => userId != null),
    rxjs.distinctUntilChanged(),
    rxjs.switchMap((userid: number) => {
      this.store.dispatch(Users.Api.Actions.loadUserByIdStarted({ userId: userid }))
      return this.store.select(selectUserById).pipe(
        rxjs.filter(users => users.some(user => user.id == userid)),
        rxjs.map(users => {
          let currentUser = users.find(user => user.id == userid)
          return currentUser
        })
      )
      //return this.getById(userid as number);
    }),
    rxjs.map(user => {
      if (user) {
        return user.firstName
      } else {
        return '';
      }
    }),
    rxjs.takeUntil(this.destroy$)
  )

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

