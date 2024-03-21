import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ChatService, PrivateMessage } from '../../Services/chat.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AuthService } from '../../Services/auth.service';
import { User, UserService } from '../../Services/user.service';
import * as rxjs from 'rxjs';
import { MessageService } from '../../Services/message.service';
import { ChannelService } from '../../Services/channel.service';
import { MatDialog} from '@angular/material/dialog';
import { HubConnectionState } from '@microsoft/signalr';
import { NotificationDialogService } from '../../Services/notification-dialog.service';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { ChatBodyComponent } from '../chat-body/chat-body.component';



@Component({
  selector: 'app-chat',
  templateUrl: './chat-mat.component.html',
  styleUrl: './chat-mat.component.css'
})
export class ChatMatComponent implements OnInit, OnDestroy {


  @ViewChild('chatBodyContainer') chatBodyContainer!: ElementRef<HTMLElement>;
  @ViewChild(CdkVirtualScrollViewport) virtualScrollViewport!: CdkVirtualScrollViewport;
  @ViewChild(CdkVirtualScrollViewport) virtualScrollViewportPublic!: CdkVirtualScrollViewport;



  public totalPrivateConversationMessagesNumber$ = new rxjs.BehaviorSubject<number>(0);
  public totalPublicChannelMessagesNumber$ = new rxjs.BehaviorSubject<number>(0);

 
  receivedPrivateMessages$ = this.messageService.receivedPrivateMessages$;
  receivedPublicMessages$ = this.messageService.receivedPublicMessages$

  initialPrivateMessageStartIndex$ = new rxjs.BehaviorSubject<number>(0);
  initialPublicMessageStartIndex$ = new rxjs.BehaviorSubject<number>(0);
 
  

  private destroy$ = new rxjs.Subject<void>();
  privateMessageSeenStatus$ = new rxjs.BehaviorSubject<boolean>(false)

  isUserTyping$ = new rxjs.BehaviorSubject<boolean>(false)
  senderId$ = new rxjs.BehaviorSubject<number | undefined>(0);

  //senderCurrentlyTyping$ = new rxjs.BehaviorSubject<string>('');
  typingStatusMap = new Map<number, string>()


  privateConversationId$ = this.chatService.privateConversationId$ // <= 
  privateConversationUsers$!: rxjs.Observable<User[]>;                             // <=
  

  newPublicMessage: string = '';
  newPrivateMessage: string = '';
  receivedPrivateMessages: PrivateMessage[] = [];
  //accessToken = this.getAccessToken();

  loadedPublicChannels: any[] = [];
  loadedPrivateChannelsByUserId: any[] = [];

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
   
    //is typing logic
    this.chatService.receiveTypingStatus()
      .pipe(
        rxjs.takeUntil(this.destroy$),

      )
      .subscribe(res => {

        //  console.log('user is typing...', res.currentlyTypingList);
        this.senderId$.next(res.senderId)
        this.isUserTyping$.next(res.isTyping)
        this.currentlyTypingUsers = res.currentlyTypingList

        //this.typingStatusMap.clear();
        
        // get user details for each senderId
        res.currentlyTypingList.forEach((senderId: number) => {
          this.userService.getById(senderId).pipe(
            rxjs.switchMap((user) => {
              if (user) {
                const firstName = user.firstName;

                // Update the typingStatusMap
                this.typingStatusMap.set(senderId, firstName);
              } else {
                console.error(`User with senderId ${senderId} not found.`);
              }
              return rxjs.of(null);
            }),
            rxjs.takeUntil(this.destroy$)
          ).subscribe();
        });

      })



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



  onTypingPrivateMessage() {
    const receiverId = this.privateConversationId$.getValue();
    const senderId = this.currentUserId$.getValue();
    const isTyping = true;
    let userName = '';
    //console.log('Typing started for receiverId:', senderId, receiverId, isTyping);

    if (senderId !== null && receiverId !== undefined) {
      // Clear existing timeout
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
      }

      //this  was causing the problem IMPORTANT 
      //this.typingStatusMap.clear()
      //this  was causing the problem IMPORTANT 
      // Update typing status map
      this.userService.getById(senderId).pipe(rxjs.takeUntil(this.destroy$)).subscribe(res => {
        userName = res.firstName
        //this.senderCurrentlyTyping$.next(userName)
      })
      this.typingStatusMap.set(senderId, userName);

      // Send typing status to the server
      this.chatService.sendTypingStatus(isTyping, senderId, receiverId);

      // Set timeout to mark user as not typing after 6000ms
      this.typingTimeout = setTimeout(() => {
        this.typingTimeout = null;
        this.typingStatusMap.delete(senderId);
        this.chatService.sendTypingStatus(false, senderId, receiverId);
      }, 3000);
    }
  }


}
