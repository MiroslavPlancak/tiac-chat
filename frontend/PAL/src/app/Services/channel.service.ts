import { Injectable, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as rxjs from 'rxjs';
import { ConnectionService } from './connection.service';
import { NotificationDialogService } from './notification-dialog.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AddUserToPrivateChannelComponent } from '../Components/add-user-to-private-channel/add-user-to-private-channel.component';

@Injectable({
  providedIn: 'root'
})
export class ChannelService implements OnDestroy {

  private apiUrl = "http://localhost:5008/api/channels"
  private destroy$ = new rxjs.Subject<void>();

  SelectedChannel$ = new rxjs.BehaviorSubject<number | undefined>(8);
  isPrivateChannel$ = new rxjs.BehaviorSubject<boolean>(false);
  selectedConversation$ = new rxjs.BehaviorSubject<number>(8);
  isCurrentUserOwner$ = new rxjs.BehaviorSubject<object>({});
  isOwnerOfPrivateChannel$ = new rxjs.BehaviorSubject<boolean>(false);
  curentlyClickedPrivateChannel$ = new rxjs.BehaviorSubject<number>(0);

  currentUserId$ = this.authService.userId$;

  public newlyCreatedPrivateChannel$ = new rxjs.BehaviorSubject<any[]>([]);
  public newlyCreatedPublicChannel$ = new rxjs.BehaviorSubject<any[]>([]);

  public removeChannelId$ = new rxjs.BehaviorSubject<number>(0);


  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private connectionService: ConnectionService,
    private dialogService: NotificationDialogService,
    private matDialog: MatDialog,
  ) {

    this.getAllPrivateChannelsByUserId$
      .pipe(rxjs.takeUntil(this.destroy$))
      .subscribe(/*console.log(`getAllPrivateChannelsByUserId$ constructor`,res)*/)

    ///////////////////Hub methods//////////////////////////

    //create new channel
    this.connectionService.hubConnection.on("NewChannelCreated", (newChannel) => {
      console.log('new channel from constructor of chat service:', newChannel)
      if (newChannel.visibility === 1) {

        this.newlyCreatedPublicChannel$.next([...this.newlyCreatedPublicChannel$.value, newChannel])

      }
      else if (newChannel.visibility === 0) {
        const newPrivateChannel =
        {
          ...newChannel,
          isOwner: true
        }
        this.newlyCreatedPrivateChannel$.next([...this.newlyCreatedPrivateChannel$.value, newPrivateChannel])
      }
    })

    //add user to private conversation
    this.connectionService.hubConnection.on('YouHaveBeenAdded', (channelId, userId, entireChannel) => {
      console.log(`You have been added to private channel ${channelId} by ${userId}`)
      this.newlyCreatedPrivateChannel$.next([...this.newlyCreatedPrivateChannel$.value, entireChannel])

      this.dialogService.openNotificationDialog(
       
        `joined private channel`,
        `You have been added to private channel ${entireChannel.name}`,
        `Close`,
        true
      )
    })
    
    //kick user from private conversation    
    this.connectionService.hubConnection.on('YouHaveBeenKicked', (channelId, userId) => {

      console.log(`You have been kicked from private channel: ${channelId}/${userId}`);
      const updateChannelList = this.newlyCreatedPrivateChannel$.value.filter(
        (channel: { id: number | null }) =>
          channel.id !== channelId
      )
      //here I need to remove the user from the private channel that has no more access  as he has been kicked
      this.newlyCreatedPrivateChannel$.next(updateChannelList)
      this.removeChannelId$.next(channelId)

      this.dialogService.openNotificationDialog(
        `Kicked from private channel`,
        `You have been kicked from private channel ${channelId}`,
        `Close`,
        true
      )
    });

    ///////////////////Hub methods//////////////////////////
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

 /////HTTP endpoint methods/////

  getListOfChannels(): Observable<any> {
    const url = `${this.apiUrl}/getAll`
    return this.http.get(url);
  }

  createNewChannel(name: string, visibility: number, createdBy: number): Observable<any> {
    const url = `${this.apiUrl}`
    const channel: any =
    {
      name: name,
      visibility: visibility,
      createdBy: createdBy
    }
    //console.log("channel service side:",channel)
    return this.http.post(url, channel);
  }


  getListOfPrivateChannelsByUserId(loggedUserId: number): Observable<any> {
    const url = `${this.apiUrl}/privateChannels?userId=${loggedUserId}`
    return this.http.get(url)
  }

  addUserToPrivateChannel(userChannel: any): Observable<any> {
    const url = `${this.apiUrl}/userChannel`;
    return this.http.post(url, userChannel);
  }

  getListOfPrivateChannelsUserhasAccessTo(userId: number): Observable<any> {
    const url = `${this.apiUrl}/privateChannels?userId=${userId}`
    return this.http.get(url);
  }

  getParticipantsOfPrivateChannel(channelId: number): Observable<any> {
    const url = `${this.apiUrl}/participants?channelId=${channelId}`
    return this.http.get(url);
  }

  removeUserFromPrivateConversation(userId: number, channelId: number): Observable<any> {
    const url = `${this.apiUrl}/userchannel?userId=${userId}&channelId=${channelId}`
    return this.http.delete(url);
  }
////HTTP endpoint methods//////////

/////service methods/////

  // add user to private channel helper method()
  inviteUserToPrivateChannel(channelId: number) {

    const dialogConfig = new MatDialogConfig()
    dialogConfig.disableClose = false
    dialogConfig.autoFocus = true

    const dialogData = {
      privateChannelId: this.SelectedChannel$.value,
      isOwner: this.isCurrentUserOwner$.value
    }

    dialogConfig.data = dialogData;
    this.matDialog.open(AddUserToPrivateChannelComponent, dialogConfig);
  }

  //private channels obs$
  public getAllPrivateChannelsByUserId$ = this.currentUserId$.pipe(
    rxjs.filter(currentUserId => currentUserId != undefined),
    rxjs.switchMap(currentUserId => {
      return this.getListOfPrivateChannelsByUserId(currentUserId as number).pipe(

        rxjs.map(privatelyOwnedChannels => {

          return privatelyOwnedChannels.map((channel: { createdBy: number; }) =>
            ({ ...channel, isOwner: channel.createdBy === currentUserId }))
        })
      )
    }),
    rxjs.takeUntil(this.destroy$)
  );

  //add the newest created private channel to the list dynamicaly obs$ 
  public latestPrivateChannels$ = rxjs.combineLatest([
    this.getAllPrivateChannelsByUserId$,
    this.newlyCreatedPrivateChannel$,
    this.removeChannelId$
  ]).pipe(
    rxjs.map(([getAllPrivateChannelsByUserId, newlyCreatedPrivateChannel, removeChannelId]) => {

      return [
        ...getAllPrivateChannelsByUserId,
        ...newlyCreatedPrivateChannel
      ];
    }),
    rxjs.takeUntil(this.destroy$),
    rxjs.tap(res => console.log(/*`87.latestPrivateChannels$:`, res*/)),

  );


  //public channels obs$
  public allPublicChannels$ = this.getListOfChannels().pipe(
    rxjs.map(publicChannels => publicChannels.filter((channel: { visibility: number; }) => channel.visibility !== 0)),
    rxjs.takeUntil(this.destroy$)
  )

  public latestPublicChannels$ = rxjs.combineLatest([
    this.allPublicChannels$,
    this.newlyCreatedPublicChannel$
  ]).pipe(
    rxjs.map(([allPublicChannels, newlyCreatedChannel]) => [
      ...allPublicChannels,
      ...newlyCreatedChannel
    ]),
    rxjs.takeUntil(this.destroy$)
    //    rxjs.tap(channels => console.log('Latest public channels:', channels))
  )

  /////service methods/////

 /////Hub methods/////

  //create a channel
  public createChannel = (
    channelName: string,
    channelType: number,
    creatorId: number
  ) => {
    this.connectionService.hubConnection?.invoke("CreateNewChannel", channelName, +channelType, creatorId)
      .catch(err => console.log(err))
  }

  // response from the server of channel creation
  public channelCreated = (): rxjs.Observable<any> => {
    return new rxjs.Observable<any>(observer => {
      this.connectionService.hubConnection?.on("NewChannelCreated", (newChannel) => {

        observer.next(newChannel)

      })
    }).pipe(rxjs.takeUntil(this.destroy$))
  }

  
  //kick user from private conversation 
  public kickUser = (userId: number, channelId: number) => {
    this.connectionService.hubConnection?.invoke("RemoveUserFromPrivateConversation", userId, channelId)
      .catch(err => console.log(err))
    console.log('kicked user info:',userId, channelId)
  }

  //invite user to private conversation
  public inviteUser = (userId: number, channelId: number) => {
    this.connectionService.hubConnection?.invoke("AddUserToPrivateConversation", userId, channelId)
      .catch(err => console.log(err))
    console.log('added user info:',userId, channelId)
  }

  
  /////Hub methods/////
}
