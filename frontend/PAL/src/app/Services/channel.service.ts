import { Injectable, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as rxjs from 'rxjs';
import { ConnectionService } from './connection.service';
import { NotificationDialogService } from './notification-dialog.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AddUserToPrivateChannelComponent } from '../Components/add-user-to-private-channel/add-user-to-private-channel.component';
import { Channel } from '../Models/channel.model';
import { Store } from '@ngrx/store';
import { Channels } from '../state/channel/channel.action'
import { selectAllChannels } from '../state/channel/channel.selector';
import { UserChannel } from '../Models/userChannel.model';
import { selectCurrentUser } from '../state/user/user.selector';

@Injectable({
  providedIn: 'root'
})
export class ChannelService implements OnDestroy {

  private apiUrl = "http://localhost:5008/api/channels"
  private destroy$ = new rxjs.Subject<void>();

  //SelectedChannel$ = new rxjs.BehaviorSubject<number | undefined>(8);
 // isPrivateChannel$ = new rxjs.BehaviorSubject<boolean>(false);
  selectedConversation$ = new rxjs.BehaviorSubject<number>(8);
  isCurrentUserOwner$ = new rxjs.BehaviorSubject<object>({});
  curentlyClickedPrivateChannel$ = new rxjs.BehaviorSubject<number>(0);

  currentUserId$ = this.store.select(selectCurrentUser).pipe(
    rxjs.filter(currentUser => !!currentUser),
    rxjs.map(currentUser => currentUser.id),
   )

  constructor(
    private http: HttpClient,
    private connectionService: ConnectionService,
    private dialogService: NotificationDialogService,
    private matDialog: MatDialog,
    private store: Store
  ) {

    //ngRx selectors for all channels and private channels
    this.store.select(selectAllChannels).pipe(rxjs.tap()).subscribe()


    ///////////////////Hub methods//////////////////////////

    //create new channel
    this.connectionService.hubConnection.on("NewChannelCreated", (newChannel) => {
      console.log('new channel created broadcast to everyone:', newChannel)
      //refresh the state of all loaded channels after the new has been created.
      this.store.dispatch(Channels.Api.Actions.loadAllChannelsStarted())

      if (newChannel.visibility === 0) {
        this.currentUserId$.pipe(rxjs.take(1)).subscribe(currentUserId =>{
          if(newChannel.createdBy === currentUserId){
            console.log(`this XXX runs`)
            this.store.dispatch(Channels.Hub.Actions.addNewPrivateChannelStarted({ newPrivateChannel: newChannel }))
          }
        })   
      }
    })

    //add user to private conversation
    this.connectionService.hubConnection.on('YouHaveBeenAdded', (channelId, userId, entireChannel) => {
      //add channel to the privateChannels state
      this.store.dispatch(Channels.Hub.Actions.inviteUserToPrivateChannelStarted({ privateChannel: entireChannel}))

      this.dialogService.openNotificationDialog(
        `joined private channel`,
        `You have been added to private channel ${entireChannel.name}`,
        `Close`,
        true
      )
    })
    
    //kick user from private conversation    
    this.connectionService.hubConnection.on('YouHaveBeenKicked', (channelId, userId) => {
      //remove channel to the privateChannels state
      this.store.dispatch(Channels.Hub.Actions.kickUserFromPrivateChannelStarted({ privateChannelId: channelId}))

      this.dialogService.openNotificationDialog(
        `Kicked from private channel`,
        `You have been kicked from private channel ${channelId}`,
        `Close`,
        true
      )
    });

  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

 /////HTTP endpoint methods/////

  getListOfChannels(): Observable<Channel[]> {
    const url = `${this.apiUrl}/getAll`
    return this.http.get<Channel[]>(url);
  }

  getListOfPrivateChannelsByUserId(loggedUserId: number): Observable<any> {
    const url = `${this.apiUrl}/privateChannels?userId=${loggedUserId}`
    return this.http.get(url)
  }

  getAllUserChannelsByUserId(userId: number): Observable<UserChannel[]>{
    const url = `${this.apiUrl}/allPrivateChannels?userId=${userId}`
    return this.http.get<UserChannel[]>(url).pipe(
      rxjs.catchError((error) =>{
        return rxjs.throwError(error.error.message)
      })
    )
  }
 //todo
  getParticipantsOfPrivateChannel(channelId: number): Observable<UserChannel[]> {
    const url = `${this.apiUrl}/participants?channelId=${channelId}`
    return this.http.get<UserChannel[]>(url);
  }
  //todo
  addUserToPrivateChannel(userChannel: UserChannel): Observable<UserChannel> {
    const url = `${this.apiUrl}/userChannel`;
    return this.http.post<UserChannel>(url, userChannel);
  }
 //todo
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
      privateChannelId: channelId,
      isOwner: this.isCurrentUserOwner$.value
    }

    dialogConfig.data = dialogData;
    this.matDialog.open(AddUserToPrivateChannelComponent, dialogConfig);
  }

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

}
