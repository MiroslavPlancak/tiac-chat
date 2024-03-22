import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChatService, PrivateMessage } from '../../Services/chat.service';
import { AuthService } from '../../Services/auth.service';
import { User, UserService } from '../../Services/user.service';
import * as rxjs from 'rxjs';
import { MessageService } from '../../Services/message.service';
import { ChannelService } from '../../Services/channel.service';
import { HubConnectionState } from '@microsoft/signalr';




@Component({
  selector: 'app-chat',
  templateUrl: './chat-mat.component.html',
  styleUrl: './chat-mat.component.css'
})
export class ChatMatComponent implements OnInit, OnDestroy {

  receivedPrivateMessages$ = this.messageService.receivedPrivateMessages$;
  receivedPublicMessages$ = this.messageService.receivedPublicMessages$

 
  private destroy$ = new rxjs.Subject<void>();
  privateMessageSeenStatus$ = new rxjs.BehaviorSubject<boolean>(false)

  isUserTyping$ = this.chatService.isUserTyping$
  senderId$ = this.chatService.senderId$

  //senderCurrentlyTyping$ = new rxjs.BehaviorSubject<string>('');
  typingStatusMap = new Map<number, string>()


  privateConversationId$ = this.chatService.privateConversationId$ // <= 
  
  

  newPublicMessage: string = '';
  newPrivateMessage: string = '';


  SelectedChannel$ = this.channelService.SelectedChannel$           // <=

  //channel properties
  channelTypes: { [key: string]: number } = {
    private: 0,
    public: 1
  };

  channelType!: number;
  writingTo = this.userService.writingTo 
  fullName: any = ""
  writeToChannelName: any;
  selectedConversation = this.channelService.selectedConversation$
  isDirectMessage = this.messageService.isDirectMessage
  isDirectMessageOffline = this.messageService.isDirectMessageOffline
  isOwnerOfPrivateChannel = false;
  curentlyClickedPrivateChannel: number = 0;
  isPrivateChannel = this.channelService.isPrivateChannel$
  isCurrentUserOwner: boolean = false;

  offlineUserSearchTerm$ = new rxjs.BehaviorSubject<string | undefined>(undefined)     
     

  privateNotification: { [userId: number]: boolean } = this.chatService.privateNotification
                              
  offlineFilteredUsers$!: rxjs.Observable<User[]>;                                    

  currentUserId$ = this.authService.userId$;   
                               
  typingTimeout!: any;
  currentlyTypingUsers: number[] = [];
  receivedPrivateMessageNotification$ = new rxjs.BehaviorSubject<boolean>(false);
  canLoadMorePrivateMessages$ = this.messageService.canLoadMorePrivateMessages$
  canLoadMorePublicMessages$ = this.messageService.canLoadMorePublicMessages$
  maxScrollValue$ = this.messageService.maxScrollValue$

  currentUserName$ = this.userService.currentUserName$
  currentUserLogged$ = this.userService.currentUserLogged$

  constructor(
    public chatService: ChatService,
    private authService: AuthService,
    public userService: UserService,
    public  messageService: MessageService,
    private channelService: ChannelService,
   

  ) {
    this.channelType = this.channelTypes['public'];
    console.log(this.chatService.hubConnection.state)
   
//    console.log(`viewport from component:`, this.virtualScrollViewport)
    
   
  }


  ngOnInit(): void {
   
    this.maxScrollValue$.subscribe(res => {console.log(`x`,res)})

    if (this.chatService.hubConnection.state === HubConnectionState.Disconnected) {
      this.chatService.hubConnection.start();
    }

    console.log(this.chatService.hubConnection.state)
    //testing http endpoint 
 
  }

  ngOnDestroy(): void {
    this.destroy$.next(); 
    this.destroy$.complete();
  }

  sendMessage(): void {

    //scroll logic
    this.messageService.maxScrollValue$.pipe(rxjs.take(1)).subscribe(maxScrollValue => {
      this.messageService.endScrollValue$.next(maxScrollValue)
    })

    const selectedChannel = this.SelectedChannel$.getValue();

    if (this.currentUserId$.getValue() && this.newPublicMessage && selectedChannel) {

      this.chatService.sendMessage(this.currentUserId$.getValue() as number, this.newPublicMessage, selectedChannel);

      const newPubMessage = this.newPublicMessage;
      this.messageService.extractUserName(this.currentUserId$.getValue()).subscribe(firstName => {

//        console.log(firstName)
        const publicMessage: any = {
          sentFromUserDTO: {
            firstName: firstName,
          },
          body: newPubMessage
        }

        //need to edit 10 here to be dynamic
        if (this.messageService.receivedPublicMessages$.value.length >= this.messageService.initialPublicMessageStartIndex$.value) {
          this.messageService.receivedPublicMessages$.value.shift()
        }

        this.messageService.receivedPublicMessages$.next([...this.receivedPublicMessages$.value, publicMessage])
        this.chatService.getLatestNumberOfPublicChannelMessages(selectedChannel, this.currentUserId$.getValue() as number)
      })
      //clear the input for the next message
      this.newPublicMessage = '';
    }
  }


  public sendPrivateMessage(): void {


    this.currentUserName$.pipe(
      rxjs.first(),
    ).subscribe((currentUserName) => {
      if (this.newPrivateMessage !== undefined && this.privateConversationId$.getValue() !== undefined) {
        
        this.chatService.sendPrivateMessage(this.privateConversationId$.getValue(), this.newPrivateMessage as string)
        const privateMessage: PrivateMessage = {
          senderId: currentUserName,
          message: this.newPrivateMessage,
          isSeen: false
        }

        if (this.messageService.receivedPrivateMessages$.value.length >= this.messageService.initialPrivateMessageStartIndex$.value) {
          this.messageService.receivedPrivateMessages$.value.shift()
        }
        this.messageService.receivedPrivateMessages$.next([...this.receivedPrivateMessages$.value, privateMessage])


        //update the number of private messages
        this.chatService.getLatestNumberOfPrivateMessages(this.currentUserId$.getValue() as number, this.privateConversationId$.getValue() as number)

        this.newPrivateMessage = '';
        
        //scroll logic
        this.messageService.maxScrollValue$.pipe(rxjs.take(1)).subscribe(maxScrollValue => {
          
        //  this.messageService.scrollToEndPrivate(maxScrollValue)
         this.messageService.endScrollValue$.next(maxScrollValue)
         })
      }
    })



  }






}
