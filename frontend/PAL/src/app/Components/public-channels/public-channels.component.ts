import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserService } from '../../Services/user.service';
import { ChannelService } from '../../Services/channel.service';
import { ChatService } from '../../Services/chat.service';
import { MessageService } from '../../Services/message.service';
import { AuthService } from '../../Services/auth.service';
import * as rxjs from 'rxjs';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CreateChannelComponent } from '../create-channel/create-channel.component';

@Component({
  selector: 'app-public-channels',
  templateUrl: './public-channels.component.html',
  styleUrl: './public-channels.component.css'
})
export class PublicChannelsComponent implements OnInit,OnDestroy {

  private destroy$ = new rxjs.Subject<void>();
  latestPublicChannels$ = this.chanelService.latestPublicChannels$
  latestPrivateChannels$ = this.chanelService.latestPrivateChannels$
  currentUserId$ = this.authService.userId$
  curentlyClickedPrivateChannel = this.chanelService.curentlyClickedPrivateChannel$
  selectedConversation = this.chanelService.selectedConversation$
  isDirectMessage = this.messageService.isDirectMessage
  SelectedChannel$ = this.chanelService.SelectedChannel$
  isDirectMessageOffline = this.messageService.isDirectMessageOffline

  // loadedPublicChannels: any[] = [];
  // loadedPrivateChannelsByUserId: any[] = [];
  channelId = 0;

  constructor
  (
    private authService: AuthService,
    public userService:UserService,
    private chanelService:ChannelService,
    private chatService:ChatService,
    private messageService:MessageService,
    private matDialog: MatDialog,
    
  ) {

    
  }
  ngOnInit(): void {

    //load the public_root channel contents when this component is initialized
    this.chatService.hubConnection?.on(`YourConnectionId`,()=>{
      this.channelIdSelectedClickHandler(8)
      
    })

    //redirect user to public_root after he has been kicked from a private channel
    this.chatService.hubConnection?.on(`YouHaveBeenKicked`, (channelId) => {
      this.channelIdSelectedClickHandler(8)
      console.log(`kicked from component's constructor`, channelId)
    })

    this.messageService.receiveMessage().pipe(
      rxjs.filter(message => message.sentToChannelId === this.SelectedChannel$.getValue()),
      rxjs.takeUntil(this.destroy$)
    )
      .subscribe((message: any) => {

        if (this.messageService.receivedPublicMessages$.value.length >= this.messageService.initialPublicMessageStartIndex$.value) {
          this.messageService.receivedPublicMessages$.value.shift()
        }

        if (this.currentUserId$.getValue() !== message.sentFromUserId) {
          this.messageService.receivedPublicMessages$.next([...this.messageService.receivedPublicMessages$.value, message])
        }
      })

      // Enable the load more button on the initial loading.
      this.getConcurrentNumberOfPublicChanelMessages(8)
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete();
  }

  public channelIdSelectedClickHandler(channelId: number): void {

    this.SelectedChannel$.next(channelId);
    this.channelId = channelId
  
    this.messageService.initialPrivateMessageStartIndex$.next(0)
    this.messageService.canLoadMorePublicMessages$.next(false)
    
    this.getConcurrentNumberOfPublicChanelMessages();

    this.curentlyClickedPrivateChannel.next(channelId)
  
    this.messageService.isDirectMessage.next(false);
    this.messageService.isDirectMessageOffline.next(false)
    
    this.loadPrivateChannels()

    //change the color of the selected channel

    this.chatService.privateConversationId$.next(undefined);

    

   
    this.extractClickedChanelInformation();
  
  }

  getConcurrentNumberOfPublicChanelMessages(intialChanelId?: number):void{
    
    if(intialChanelId !==undefined){
      this.chatService.getLatestNumberOfPublicChannelMessages(intialChanelId, this.currentUserId$.getValue() as number)
    }

    this.chatService.getLatestNumberOfPublicChannelMessages(this.channelId, this.currentUserId$.getValue() as number)
    this.chatService.receiveLatestNumberOfPublicChannelMessages()
      .pipe(
        rxjs.first(),
        rxjs.switchMap(totalNumberofPublicMessages => {
          this.messageService.totalPublicChannelMessagesNumber$.next(totalNumberofPublicMessages)

       
          this.messageService.canLoadMorePublicMessages$.next(totalNumberofPublicMessages > 10);
          const startIndex = 0
          const endIndex = totalNumberofPublicMessages - (totalNumberofPublicMessages - 10);
          this.messageService.initialPublicMessageStartIndex$.next(endIndex)
      
          return this.messageService.loadPaginatedPublicMessagesById(this.channelId, startIndex, endIndex)
            .pipe(rxjs.first())
        }),
        rxjs.takeUntil(this.destroy$)
      ).subscribe(paginatedPublicMessages => {

        this.messageService.receivedPublicMessages$.next(
          paginatedPublicMessages
        )
 
      })
  }

  loadPrivateChannels():void{
//changed this
    this.chanelService.getAllPrivateChannelsByUserId$
    .pipe(rxjs.takeUntil(this.destroy$))
    .subscribe(loadedPrivateChannels => {
      const ownedChannels = loadedPrivateChannels.filter((channel: { isOwner: any; }) => channel.isOwner);
      const isOwner = ownedChannels.some((channel: { id: number; }) => channel.id == this.channelId);

      
      this.chanelService.isCurrentUserOwner$.next(isOwner)

      if (isOwner) {
        this.chanelService.isOwnerOfPrivateChannel$.next(true)
      } else {
        this.chanelService.isOwnerOfPrivateChannel$.next(false)
      }

      const checkChannelType = loadedPrivateChannels.some((channel: { id: number; }) => channel.id == this.channelId);
      if (checkChannelType) {
        this.chanelService.isPrivateChannel$.next(true)
      } else {
        this.chanelService.isPrivateChannel$.next(false)
      }
    });
  }

  extractClickedChanelInformation():void{

    this.chanelService.getListOfChannels().pipe(

      rxjs.first(),
      rxjs.map(clickedChannel => clickedChannel.find((channel: { id: number; }) => channel.id === this.channelId)),
      rxjs.takeUntil(this.destroy$)
    )
      .subscribe(channel => {
        if (channel) {
          this.selectedConversation.next(channel.id);
          this.userService.writingTo.next(`${channel.name}`) 
          this.userService.writeToChannelName.next(`writing to ${channel.name}`)
        }
      }

      )
  }

  openDialog() {

    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = true;

    const dialogData = {
      currentUserId: this.currentUserId$
    }


    dialogConfig.data = dialogData;
    const dialogRef = this.matDialog.open(CreateChannelComponent, dialogConfig);

    dialogRef.componentInstance.channelCreated
      .pipe(rxjs.takeUntil(this.destroy$))
      .subscribe((createdChannelDetails: any) => {
        console.log(`created channel over mat dialog result: `, createdChannelDetails)
      })
  }

}
