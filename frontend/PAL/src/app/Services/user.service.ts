import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';
import { BehaviorSubject, Observable, Subject, tap } from 'rxjs';
import * as rxjs from 'rxjs';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ChannelService } from './channel.service';
import { AddUserToPrivateChannelComponent } from '../Components/add-user-to-private-channel/add-user-to-private-channel.component';
import { ConnectionService } from './connection.service';
import { NotificationDialogService } from './notification-dialog.service';

export interface User {
  id: number,
  firstName: string,
  lastName: string,
  email: string
}

@Injectable({
  providedIn: 'root'
})
export class UserService implements OnDestroy {


  private destroy$ = new rxjs.Subject<void>();
  public allUsersSubject$ = new BehaviorSubject<User[]>([])
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

      this.getAllUsersBS$()
        .pipe(rxjs.takeUntil(this.destroy$))
        .subscribe(res => console.log( /*`getAllUsersBS$: chat.service.ts constructor`,res*/));

      const userIds = Object.keys(connection).map(strUserId => +strUserId);
      this.onlineUserIds$.next(userIds);

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

  getById(userId: number): Observable<User> {
    if (!userId) { throw new Error() }
    const url = `${this.apiUrl}${userId}`;
    return this.http.get<any>(url);
  }

  getAllUsers(): Observable<User[]> {
    const url = `${this.apiUrl}getAll`
    return this.http.get<User[]>(url);
  }

  getAllUsersBS$(): Observable<User[]> {
    const url = `${this.apiUrl}getAll`;
    return this.http.get<User[]>(url).pipe(
      tap(users => this.allUsersSubject$.next(users))
    );
  }

  /////HTTP endpoint methods/////

  /////Service methods/////

  // get all users obs$
  public allUsers$ = this.getAllUsers().pipe(
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
    this.allUsersSubject$,
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
    this.allUsersSubject$,
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
      return this.getById(userid as number);
    }),
    rxjs.map(user => {
      return {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    }),
    rxjs.takeUntil(this.destroy$)
  )
  // current user name obs$
  currentUserName$ = this.authService.userId$.pipe(
    rxjs.filter((userId: any) => userId != null),
    rxjs.distinctUntilChanged(),
    rxjs.switchMap((userid: number) => {
      return this.getById(userid as number);
    }),
    rxjs.map(user => user.firstName),
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
