import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { map, take } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ChannelService } from '../../Services/channel.service';
import { AuthService } from '../../Services/auth.service';
import { Store } from '@ngrx/store';
import { Users } from '../../state/user/user.action'
import { selectUserById } from '../../state/user/user.selector';
import * as rxjs from 'rxjs';
import { User } from '../../Models/user.model';
import { Channels } from '../../state/channel/channel.action'
import { selectAllChannels, selectParticipantsOfPrivateChannel, selectRemainingParticipantsOfPrivateChannel } from '../../state/channel/channel.selector';

@Component({
  selector: 'app-add-user-to-private-channel',
  templateUrl: './add-user-to-private-channel.component.html',
  styleUrl: './add-user-to-private-channel.component.css'
})
export class AddUserToPrivateChannelComponent implements OnInit {


  @Output() userAddedToPrivateChannel = new EventEmitter<any>();

 
  //ngRx props
  currentParticipants$!: rxjs.Observable<User[]>
  remainingParticipants$!: rxjs.Observable<User[]>

  selectedUserId: number = 0
  addedEntryToPrivateChannel: boolean = false;
  ErrorMessage: string = '';
  selectedUserIdName: any = {
    firstName: '',
    lastName: ''
  };
  selectedChannelIdName: string | null = '';

  isOwnerOfPrivateChannel: boolean = false;
  selectedPrivateChannelId: any;


  constructor(
    @Inject(MAT_DIALOG_DATA) public matData: any,
    private dialogRef: MatDialogRef<AddUserToPrivateChannelComponent>,
    private channelService: ChannelService,
    public authService: AuthService,
    private store: Store

  ) {

    this.isOwnerOfPrivateChannel = this.matData.isOwner;
    this.selectedPrivateChannelId = this.matData.privateChannelId

 
  }

  ngOnInit(): void {

    //extract channel name from the state
    this.store.select(selectAllChannels)
      .pipe(
        map(channels => channels.filter((channelName: { id: any; }) => channelName.id === this.matData.privateChannelId)),
        map(filteredChannels => filteredChannels.length > 0 ? filteredChannels[0].name : null),
        take(1)
      )
      .subscribe(channelName => {
        console.log('channelName: ', channelName);
        this.selectedChannelIdName = channelName;
      })

    //current participants in the private channels
    this.store.dispatch(Channels.Api.Actions.loadParticipantsOfPrivateChannelStarted({ channelId: this.matData.privateChannelId}))
    this.currentParticipants$ = this.store.select(selectParticipantsOfPrivateChannel).pipe(rxjs.filter(participantsLoaded => !!participantsLoaded))
   
    // remaining participants that can be added to private channel
    this.remainingParticipants$ = this.store.select(selectRemainingParticipantsOfPrivateChannel)

  }

  //add user to private channel
  addUserToPrivateChannel() {

    this.addedEntryToPrivateChannel = true;

    const selectedUser = this.selectedUserId;
    const privateChannelId = this.matData.privateChannelId;
    const isOwner = false;

    //this bit needs changing into behavior subject
    this.channelService.inviteUser(selectedUser, privateChannelId)

    const userChannel = {
      id:0,
      user_Id: +selectedUser,
      channel_Id: +privateChannelId,
      isOwner: isOwner
    }

    this.store.dispatch(Channels.Api.Actions.loadPrivateUserChannelStarted({ userChannelObj: userChannel}))
 

    //get UserName
    //ngRx implementation
    this.store.dispatch(Users.Api.Actions.loadUserByIdStarted({ userId: this.selectedUserId }))
    this.store.select(selectUserById).pipe(
      rxjs.filter(users => users.some(user => user.id == this.selectedUserId)),
      rxjs.map(users => {
        const user = users.find(user => user.id == this.selectedUserId)
        return user
      }),
      take(1)
    )
      .subscribe(userName => {
        this.selectedUserIdName = {
          firstName: userName?.firstName,
          lastName: userName?.lastName
        }
      })

    //get ChannelName
    this.store.select(selectAllChannels)
      .pipe(
        map(channels => channels.filter((channelName: { id: any; }) => channelName.id === this.matData.privateChannelId)),
        map(filteredChannels => filteredChannels.length > 0 ? filteredChannels[0].name : null)
      )
      .subscribe(channelName => {
        console.log('channelName: ', channelName);
        this.selectedChannelIdName = channelName;
      })

  }

  addAnother() {
    this.addedEntryToPrivateChannel = false;
    this.ErrorMessage = '';
  }

  close() {
    this.dialogRef.close();
  }

  removeUserFromPrivateChannel(userId: number) {
    this.channelService.kickUser(userId, this.selectedPrivateChannelId)
    this.store.dispatch(Channels.Api.Actions.removeUserFromUserChannelStarted({ userId: userId, channelId: this.selectedPrivateChannelId}))
  }

}