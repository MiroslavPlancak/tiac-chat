import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { User, UserService } from '../../Services/user.service';
import { map, switchMap, take } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ChannelService } from '../../Services/channel.service';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-add-user-to-private-channel',
  templateUrl: './add-user-to-private-channel.component.html',
  styleUrl: './add-user-to-private-channel.component.css'
})
export class AddUserToPrivateChannelComponent implements OnInit {


  @Output() userAddedToPrivateChannel = new EventEmitter<any>();

  listOfUsers: User[] = [];   ////////////////
  selectedUserId: number = 0
  addedEntryToPrivateChannel: boolean = false;
  ErrorMessage: string = '';
  selectedUserIdName: any = {
    firstName: '',
    lastName: ''
  };
  selectedChannelIdName: string = '';
  listOfAddedUsers: User[] = [];   ///////////////
  isOwnerOfPrivateChannel: boolean = false;
  selectedPrivateChannelId: any;


  constructor(
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) public matData: any,
    private dialogRef: MatDialogRef<AddUserToPrivateChannelComponent>,
    private channelService: ChannelService,
    public authService: AuthService

  ) {

    this.isOwnerOfPrivateChannel = this.matData.isOwner;
    this.selectedPrivateChannelId = this.matData.privateChannelId

    //console.log(`x`,this.selectedPrivateChannelId)
  }

  ngOnInit(): void {
    
    //extract channel name
    this.channelService.getListOfChannels()
      .pipe(
        map(channels => channels.filter((channelName: { id: any; }) => channelName.id === this.matData.privateChannelId)),
        map(filteredChannels => filteredChannels.length > 0 ? filteredChannels[0].name : null),
        take(1)
      )
      .subscribe(channelName => {
        console.log('channelName: ', channelName);
        this.selectedChannelIdName = channelName;
      })


    //fill the list of added users
    this.channelService.getParticipantsOfPrivateChannel(this.matData.privateChannelId).pipe(
      switchMap(participantIds => {
        //console.log(`list of users in a private channel:`, participantIds)
        const userIds = participantIds.map((participant: { user_Id: number; }) => participant.user_Id)

        return this.userService.getAllUsers().pipe(
          map(users => users.filter(user => userIds.includes(user.id)))
        )
      })
    ).subscribe(filteredParticipants => {
      //console.log(`transformed users`, filteredParticipants)
      this.listOfAddedUsers.push(...filteredParticipants);
    })


    //create the list of users that remain  to be added
    this.channelService.getParticipantsOfPrivateChannel(this.matData.privateChannelId).pipe(
      switchMap(participantIds => {
        console.log(`list of users in a private channel:`, participantIds)

        const userIds = participantIds.map((participant: { user_Id: number; }) => participant.user_Id)

        return this.userService.getAllUsers().pipe(
          map(users => users.filter(user => !userIds.includes(user.id)))
        )
      })
    ).subscribe(filteredParticipants => {
      console.log(`transformed users(new);`, filteredParticipants)
      this.listOfUsers.push(...filteredParticipants);
    })

  }

  //add user to private channel
  addUserToPrivateChannel() {

    this.addedEntryToPrivateChannel = true;

    const selectedUser = this.selectedUserId;
    const privateChannelId = this.matData.privateChannelId;
    const isOwner = false;

    //this bit needs changing into behavior subject
    this.userService.inviteUser(selectedUser, privateChannelId)

    const userChannel = {
      user_id: +selectedUser,
      channel_id: +privateChannelId,
      isOwner: isOwner
    }

    this.channelService.addUserToPrivateChannel(userChannel).subscribe({
      next: (response: any) => {
        console.log('Response from server:', response);

        const addedUser = this.listOfUsers.find(u => u.id === response.user_Id)

        if (addedUser) {
          this.listOfAddedUsers.push(addedUser);
          this.listOfUsers = this.listOfUsers.filter(u => u.id !== addedUser.id); // Remove user from the list
        }
        // Handle successful response if needed
      },
      error: (error: any) => {
        console.error('Error adding user to private channel:', error);
        if (error instanceof HttpErrorResponse) {
          if (error.status === 500 && error.error) {
            const errorMessage = error.error;
            this.ErrorMessage = 'Selected user is already in this channel.'
          }
        }
      }
    })

    //get UserName
    this.userService.getById(this.selectedUserId).pipe(take(1)).subscribe(userName => {
      this.selectedUserIdName = {
        firstName: userName.firstName,
        lastName: userName.lastName
      }
    })

    //get ChannelName
    this.channelService.getListOfChannels()
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

    this.channelService.removeUserFromPrivateConversation(userId, this.selectedPrivateChannelId).subscribe(() => {
      const removedUser = this.listOfAddedUsers.find(user => user.id === userId);
      this.listOfAddedUsers = this.listOfAddedUsers.filter(user => user.id !== userId);

      if (removedUser) {
        this.listOfUsers.push(removedUser);
      }
    })

    this.userService.kickUser(userId, this.selectedPrivateChannelId)

  }

}