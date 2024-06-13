import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserService } from '../../Services/user.service';
import { ChannelService } from '../../Services/channel.service';
import { ChatService } from '../../Services/chat.service';
import { MessageService } from '../../Services/message.service';
import { AuthService } from '../../Services/auth.service';
import * as rxjs from 'rxjs';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CreateChannelComponent } from '../create-channel/create-channel.component';
import { Store } from '@ngrx/store';
import { Users } from '../../state/user/user.action'
import { Messages } from '../../state/message/message.action'
import {  selectCurrentUser } from '../../state/user/user.selector';
import { Channels } from '../../state/channel/channel.action'
import { selectAllChannels, selectAllPrivateChannels, selectAllPublicChannels, selectCurrentlyClickedPrivateConversation, selectCurrentlyClickedPublicConversation, selectPrivateChannels } from '../../state/channel/channel.selector';
import { privateMessagesStartEndIndex, selectPublicMessagesNumberFromChannelId, selectPublicRecordById } from '../../state/message/message.selector';


@Component({
  selector: 'app-public-channels',
  templateUrl: './public-channels.component.html',
  styleUrl: './public-channels.component.css'
})
export class PublicChannelsComponent implements OnInit,OnDestroy {

  private destroy$ = new rxjs.Subject<void>();
  latestPublicChannels$ = this.store.select(selectAllPublicChannels)
  latestPrivateChannels$ = this.store.select(selectAllPrivateChannels)
  currentUserId$ = this.authService.userId$
  currentUserIdNgRx$ = this.store.select(selectCurrentUser).pipe(
    rxjs.filter(user => !!user),
    rxjs.map(user => user.id)
  )
  curentlyClickedPrivateChannel = this.chanelService.curentlyClickedPrivateChannel$
  selectedConversation = this.chanelService.selectedConversation$
  isDirectMessage = this.messageService.isDirectMessage
  SelectedChannel$ = this.store.select(selectCurrentlyClickedPublicConversation)
  isDirectMessageOffline = this.messageService.isDirectMessageOffline

  // loadedPublicChannels: any[] = [];
  // loadedPrivateChannelsByUserId: any[] = [];
  channelId = 0;

  constructor
  (
    private authService: AuthService,
    public userService:UserService,
    public chanelService:ChannelService,
    private chatService:ChatService,
    private messageService:MessageService,
    private matDialog: MatDialog,
    private store: Store
    
  ) {
    
    
  }
  ngOnInit(): void {
    //test
      //load all private channels by user ID
     this.store.dispatch(Channels.Api.Actions.loadUserChannelByUserIdStarted({ userId: Number(this.authService.userId$.getValue())}))
     
    //this.latestPrivateChannels$.subscribe((res)=> console.log(`test`,res))
    //load the public_root channel contents when this component is initialized
    this.chatService.hubConnection?.on(`YourConnectionId`, (connection: Record<string, string>, connectedUser: number, fullName: string)=>{
     
      this.store.select(selectCurrentUser).pipe(
        rxjs.filter(user=> !!user),
        rxjs.map(user => user.id),
        rxjs.take(1)
      ).subscribe(userId => {
        if(connectedUser === userId){
          // console.log(`x`,userId)
          
          this.channelIdSelectedClickHandler(8)
        }
        
      });   
    })

    //redirect user to public_root after he has been kicked from a private channel
    this.chatService.hubConnection?.on(`YouHaveBeenKicked`, (channelId) => {
      this.channelIdSelectedClickHandler(8)
//      console.log(`kicked from component's constructor`, channelId)
    })

    //ngRx implementation
    // this.store.select(selectCurrentlyClickedConversation).pipe(
    //   rxjs.switchMap(selectedChannel =>{
    //     return this.messageService.receiveMessage().pipe(
    //       rxjs.filter(message => message.sentToChannelId === selectedChannel),
    //       rxjs.takeUntil(this.destroy$)
    //     )
    //   })
    // ).subscribe((message: any) => {
    //   console.log(`public message received(elsewhere:)`, message)
    //   this.store.dispatch(Messages.Hub.Actions.receivePublicMessageStarted({ publicMessage:message }))
    //   // if (this.messageService.receivedPublicMessages$.value.length >= this.messageService.initialPublicMessageStartIndex$.value) {
    //   //   this.messageService.receivedPublicMessages$.value.shift();
    //   // }
    
    //   // if (this.currentUserId$.getValue() !== message.sentFromUserId) {
    //   //   this.messageService.receivedPublicMessages$.next([...this.messageService.receivedPublicMessages$.value, message]);
    //   // }
    // });

    //old implementation
    // this.messageService.receiveMessage().pipe(
    //   rxjs.filter(message => message.sentToChannelId === this.SelectedChannel$.getValue()),
    //   rxjs.takeUntil(this.destroy$)
    // )
    //   .subscribe((message: any) => {

    //     if (this.messageService.receivedPublicMessages$.value.length >= this.messageService.initialPublicMessageStartIndex$.value) {
    //       this.messageService.receivedPublicMessages$.value.shift()
    //     }

    //     if (this.currentUserId$.getValue() !== message.sentFromUserId) {
    //       this.messageService.receivedPublicMessages$.next([...this.messageService.receivedPublicMessages$.value, message])
    //     }
    //   })

      // Enable the load more button on the initial loading. 
      //############## this was causing improper loading ###########////
    //  this.getConcurrentNumberOfPublicChanelMessages(8)
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete();
  }

  public channelIdSelectedClickHandler(channelId: number): void {
    // console.log(`this runs`,channelId)
    this.store.dispatch(Channels.Flag.Actions.loadCurrentlyClickedConversationStarted({ conversationId: channelId}))
  
    this.store.dispatch(Messages.Api.Actions.clearPaginatedPublicMessagesStarted({ channelId: channelId}))

    this.store.dispatch(Messages.Flag.Actions.setPublicInitialLoadingAutoScrollValueStarted({ autoScrollValue: false }))

    this.store.dispatch(Messages.Flag.Actions.resetPublicStartEndIndexFlagStarted())

    this.channelId = channelId
    this.messageService.conversationId$.next(channelId)
    this.messageService.initialPrivateMessageStartIndex$.next(0)
    //this.messageService.canLoadMorePublicMessages$.next(false)
    
    this.getConcurrentNumberOfPublicChanelMessages(channelId);

    this.curentlyClickedPrivateChannel.next(channelId)
  
    this.messageService.isDirectMessage.next(false);
    this.messageService.isDirectMessageOffline.next(false)
    
    this.loadPrivateChannels()

    //change the color of the selected channel

    this.chatService.privateConversationId$.next(undefined);

    

   
    this.extractClickedChanelInformation();
  
  }

  getConcurrentNumberOfPublicChanelMessages(intialChanelId?: number):void{
    // console.log(`and this runs`,intialChanelId)

    /// need to investigate this and probably remove it
    if(intialChanelId !==undefined){
      this.chatService.getLatestNumberOfPublicChannelMessages(intialChanelId, this.currentUserId$.getValue() as number)
    }
    
    //select ngRx test slice of the state of publicMessagesCountRecord
    this.store.dispatch(Messages.Hub.Actions.requestLatestNumberOfPublicMessagesByChannelIdStarted())
    this.store.dispatch(Messages.Hub.Actions.recieveLatestNumberOfPublicMessagesByChannelIdStarted())
   

   
    this.store.select(selectPublicMessagesNumberFromChannelId)
      .pipe(
     
     rxjs.take(2),
       rxjs.filter(loadedMessagesNumber => !!loadedMessagesNumber),
        rxjs.switchMap((publicMessages) => {
        //  console.log(`publicMessages`, publicMessages)

          if(publicMessages > 10){
           this.store.dispatch(Messages.Flag.Actions.setCanLoadMorePublicMessagesFlagStarted({canLoadMore: true}))
          }else{
            this.store.dispatch(Messages.Flag.Actions.setCanLoadMorePublicMessagesFlagStarted({canLoadMore: false}))
          }
          this.messageService.totalPublicChannelMessagesNumber$.next(publicMessages)
          
       
          //this.messageService.canLoadMorePublicMessages$.next(publicMessages > 10);
          const startIndex = 0
          const endIndex = publicMessages - (publicMessages - 10);
          this.messageService.initialPublicMessageStartIndex$.next(endIndex)
          //ngRx
          this.store.dispatch(Messages.Flag.Actions.setPublicStartEndIndexFlagStarted({ startIndex: startIndex, endIndex: endIndex}))


          this.store.dispatch(Messages.Api.Actions.loadPaginatedPublicMessagesStarted({channelId: this.channelId, startIndex: startIndex, endIndex:endIndex}))
          //return this.store.select(selectPublicRecordById(this.channelId))
          return rxjs.of(rxjs.EMPTY)
         
          // return this.messageService.loadPaginatedPublicMessagesById(this.channelId, startIndex, endIndex)
          //   .pipe(rxjs.first())
        }),
        rxjs.takeUntil(this.destroy$)
      ).subscribe()
  }

  loadPrivateChannels():void{
//changed this
    this.store.select(selectPrivateChannels)
    .pipe(rxjs.take(1), /*rxjs.tap((res)=> console.log(`component outpout:`, res))*/)
    .subscribe(loadedPrivateChannels => {
    //  console.log(`thisfires`)
     // const ownedChannels = loadedPrivateChannels.filter((channel: { isOwner: any; }) => channel.isOwner);
     // const isOwner = ownedChannels.some((channel: { id: number; }) => channel.id == this.channelId);

      
      // this.chanelService.isCurrentUserOwner$.next(isOwner)

      // if (isOwner) {
      //   this.chanelService.isOwnerOfPrivateChannel$.next(true)
      // } else {
      //   this.chanelService.isOwnerOfPrivateChannel$.next(false)
      // }

      // const checkChannelType = loadedPrivateChannels.some((channel: { id: number; }) => channel.id == this.channelId);
      // if (checkChannelType) {
      //   this.chanelService.isPrivateChannel$.next(true)
      // } else {
      //   this.chanelService.isPrivateChannel$.next(false)
      // }
    });
  }

  extractClickedChanelInformation():void{

    this.store.select(selectAllChannels).pipe(

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
