import { Component, EventEmitter, Inject, OnDestroy, Output } from '@angular/core';
import { ChannelService } from '../../Services/channel.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../Services/auth.service';
import { distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { UserService } from '../../Services/user.service';
import { of } from 'rxjs';
import { Store } from '@ngrx/store';
import { Users } from '../../state/user/user.action'
import { selectUserById } from '../../state/user/user.selector';
import * as rxjs from 'rxjs';

@Component({
  selector: 'app-create-channel',
  templateUrl: './create-channel.component.html',
  styleUrl: './create-channel.component.css'
})
export class CreateChannelComponent implements OnDestroy {



  @Output() channelCreated = new EventEmitter<any>();

  channelName!: string; // Define channelName property

  channelTypes: { [key: string]: number } = {
    private: 0,
    public: 1
  };
  newChannelName!: string;
  newChannelType!: number;
  newChannelCreator!: string;

  newChannelCreated = false;
  channelType: number = this.channelTypes['public'];


  currentUserLogged$ = this.authService.userId$.pipe(
    filter(userId => userId != null),
    distinctUntilChanged(),
    switchMap(userid => {
      //ngRx implementation
      this.store.dispatch(Users.Api.Actions.loadUserByIdStarted({ userId: userid as number }))
      return this.store.select(selectUserById).pipe(
        rxjs.filter(users => users.some(user => user.id == userid)),
        rxjs.map(users => {
          const user = users.find(users => users.id == userid)
          return user
        })
      )
      //old implementation
      //  return this.userService.getById(userid as number);
    }),
    map(user => {
      return {
        firstName: user?.firstName || 'loading'
      }
    })
  )


  constructor(
    private channelService: ChannelService,
    private dialogRef: MatDialogRef<CreateChannelComponent>,
    @Inject(MAT_DIALOG_DATA) public matData: any,
    private authService: AuthService,
    private userService: UserService,
    private store: Store
  ) { }
  ngOnDestroy(): void {

  }



  createChannel() {
    //console.log(`mat component`, this.matData);
    if (this.channelName !== undefined && this.channelType !== null && this.matData.currentUserId !== null) {

      this.channelService.createChannel(this.channelName, this.channelType, this.matData.currentUserId.getValue())




      this.channelService.channelCreated().pipe(
        switchMap(newChannel => {

          return this.currentUserLogged$.pipe(
            switchMap(result => {

              const createdChannelDetails = {
                id: newChannel.id,
                name: newChannel.name,
                type: newChannel.visibility,
                createdBy: newChannel.createdBy,
                isOwner: true
              };

              // Update component properties
              this.newChannelName = newChannel.name;
              this.newChannelType = newChannel.visibility;
              this.newChannelCreator = newChannel.createdBy;
              this.newChannelCreator = result.firstName;

              // Emit createdChannelDetails
              this.channelCreated.emit(createdChannelDetails);

              return of(null);
            })
          );
        })
      ).subscribe();

      this.newChannelCreated = true;
      this.channelName = "";
    }
  }

  close() {
    this.dialogRef.close();
  }


  getChannelTypeText(type: number): string {
    return type === this.channelTypes['private'] ? 'Private' : 'Public';
  }

}
