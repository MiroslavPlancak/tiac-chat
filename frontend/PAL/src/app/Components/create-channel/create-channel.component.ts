import { Component, EventEmitter, Inject, OnDestroy, Output } from '@angular/core';
import { ChannelService } from '../../Services/channel.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../Services/auth.service';
import { distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { UserService } from '../../Services/user.service';
import { ChatService } from '../../Services/chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-create-channel',
  templateUrl: './create-channel.component.html',
  styleUrl: './create-channel.component.css'
})
export class CreateChannelComponent implements OnDestroy {



  @Output() channelCreated = new EventEmitter<any>();
  private newChannelSubscription:Subscription | undefined;
  channelName!: string; // Define channelName property
 
  channelTypes: { [key: string]: number } = {
    private: 0,
    public: 1
  };
  newChannelName!:string;
  newChannelType!:number;
  newChannelCreator!:string;

  newChannelCreated = false;
  channelType: number = this.channelTypes['public'];
  newChannel:any;

  currentUserLogged$ = this.authService.userId$.pipe(
    filter(userId => userId != null),
    distinctUntilChanged(),
    switchMap(userid => {
      return this.userService.getById(userid as number);
    }),
    map(user => {
      return {
        firstName: user.firstName
      }
    })
  )

  
  constructor(
    private channelService: ChannelService,
    private dialogRef: MatDialogRef<CreateChannelComponent>,
    @Inject(MAT_DIALOG_DATA) public matData: any,
    private authService: AuthService,
    private userService: UserService,
    private chatService:ChatService
  ) { }
  ngOnDestroy(): void {
    if(this.newChannelSubscription){
      this.newChannelSubscription.unsubscribe()
    }
  }



  createChannel() { 
    //console.log(`mat component`, this.matData);
    if (this.channelName !== undefined && this.channelType !== null && this.matData.currentUserId !== null) {
                          
       this.chatService.createNewChannel(this.channelName, this.channelType, this.matData.currentUserId.getValue())
       
       if(this.newChannelSubscription){
        this.newChannelSubscription.unsubscribe();
       }
       
       this.newChannelSubscription = this.chatService.newChannelCreated().subscribe(newChannel => {
        
        const createdChannelDetails ={
          id: newChannel.id,
          name: newChannel.name,
          type: newChannel.visibility,
          createdBy: newChannel.createdBy,
          isOwner: true
        }
        this.newChannelName = newChannel.name
        this.newChannelType = newChannel.visibility
        this.newChannelCreator = newChannel.createdBy
        this.currentUserLogged$.subscribe(result => {
          this.newChannelCreator= result.firstName;
        })
        
        this.channelCreated.emit(createdChannelDetails)
      })
      
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
