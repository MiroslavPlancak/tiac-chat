import { Injectable, OnDestroy, OnInit } from '@angular/core';
import * as rxjs from 'rxjs';
import { AuthService } from './auth.service';
import { User, UserService } from './user.service';
import { ChannelService } from './channel.service';
import { NotificationDialogService } from './notification-dialog.service';
import { ConnectionService } from './connection.service';


export interface PrivateMessage {
  isSeen: boolean
  senderId: string
  message: string
}

@Injectable({
  providedIn: 'root'
})

export class ChatService implements OnInit,OnDestroy {

  public hubConnection = this.connectionService.hubConnection
  currentUserId$ = this.authService.userId$;
  public onlineUserIds$ = new rxjs.BehaviorSubject<number[]>([]);
    //channel logic TODO:add private channels as well 
  public newlyCreatedPublicChannel$ = new rxjs.BehaviorSubject<any[]>([]);
  public newlyCreatedPrivateChannel$ = new rxjs.BehaviorSubject<any[]>([]);
  public newlyRegisteredUser$ = new rxjs.BehaviorSubject<User[]>([])

  // add / remove user from private channel
  public userStatusPrivateChannel$ = new rxjs.BehaviorSubject<boolean|undefined>(undefined)
  public removeChannelId$ = new rxjs.BehaviorSubject<number>(0);

  //destroy
  private destroy$ = new rxjs.Subject<void>();

  senderId$ = new rxjs.BehaviorSubject<number | undefined>(0);
  isUserTyping$ = new rxjs.BehaviorSubject<boolean>(false)
  currentlyTypingUsers$ = new rxjs.BehaviorSubject<number[]>([])
  typingStatusMap = new Map<number, string>()
  typingStatusMap$ = new rxjs.BehaviorSubject<Map<number,string>>(new Map<number,string>)
  userNameTyping$ = new rxjs.BehaviorSubject<string>('')

  privateNotification: { [userId: number]: boolean } = {}
  privateConversationId$ = new rxjs.BehaviorSubject<number | undefined>(undefined)



  typingTimeout: any;



  constructor(
    private authService: AuthService,
    private userService: UserService,
    private connectionService:ConnectionService


  ) { }


  ngOnInit(): void {
   
  }

  ngOnDestroy(): void {
    
    this.destroy$.next(); 
    this.destroy$.complete();
  }

  public sendMessage = (user: number, message: string, selectedChannel: number) => {
    this.hubConnection?.invoke("SendPublicMessageTest", user, message, selectedChannel)
   // .then(() => console.log('public message sent successfully. response from the server!'))
      .catch(err => console.log(err));

  //  console.log('connection id', this.onlineUsers$);
  }

  public receiveMessage = (): rxjs.Observable<any> => {
    return new rxjs.Observable<any>(observer => {
      this.hubConnection?.on("ReceiveMessage", (message) => {
        observer.next(message);
      })
    }).pipe(rxjs.takeUntil(this.destroy$))
  }

  public LogoutUser = () => {
   
    this.hubConnection?.invoke("LogoutUserAsync").catch(err => console.log(err));
  
  }



  //kick user from private conversation 
  public kickUser = (userId: number, channelId: number) => {
    this.hubConnection?.invoke("RemoveUserFromPrivateConversation", userId, channelId)
      .catch(err => console.log(err))
    console.log('kicked user info:')
  }

  //invite user to private conversation
  public inviteUser = (userId: number, channelId: number) => {
    this.hubConnection?.invoke("AddUserToPrivateConversation", userId, channelId)
      .catch(err => console.log(err))
    console.log('added user info:')
  }





  public sendPrivateMessage = (
    recipientId: number | null | undefined,
    message: string) => {
    this.hubConnection?.invoke("SendPrivateMessage", recipientId, message)
      .catch(err => console.log(err));


  }


  public receivePrivateMesages = (): rxjs.Observable<PrivateMessage> => {
    return new rxjs.Observable<PrivateMessage>(observer => {
      this.hubConnection?.on("ReceivePrivateMessages", (senderId, message, messageId, isSeen) => {
       // console.log('senderId & message & messageId & status:', senderId, message,messageId, isSeen );
        observer.next({ senderId, message, isSeen });
      })
    })
  }

 /////////////////////////channel creation///////////////////////////////////////
  public createNewChannel = (
    channelName: string,
    channelType: number,
    creatorId: number
  ) => {
    this.hubConnection?.invoke("CreateNewChannel", channelName, +channelType, creatorId)
      .catch(err => console.log(err))
  }

  public newChannelCreated = (): rxjs.Observable<any> => {
    return new rxjs.Observable<any>(observer => {
      this.hubConnection?.on("NewChannelCreated", (newChannel) => {

        observer.next(newChannel)

      })
    }).pipe(rxjs.takeUntil(this.destroy$))
  }

  //seen logic
  public notifyReceiverOfPrivateMessage = (object:any) => {
    this.hubConnection?.invoke("NotifyReceiverOfPrivateMessage", object)
    .catch(err => console.log(err))
  }

  public privateMessageReceived = (): rxjs.Observable<any> => {
    return new rxjs.Observable<any> (observer => {
      this.hubConnection?.on("PrivateMessageReceived", (privateMessage)=>{
       //console.log('Private message received/chat.service.ts:', privateMessage);
        observer.next(privateMessage)
      })
    }).pipe(rxjs.takeUntil(this.destroy$))
  }
  //seen logic

  //is typing logic
  public sendTypingStatus = (
    isTyping:boolean, 
    senderId: number, 
    receiverId:number
    ) =>{
    this.hubConnection?.invoke("SendTypingStatus", isTyping, senderId, receiverId )
    .catch(err => console.log(err))
  }
  public receiveTypingStatus = (): rxjs.Observable<any> => {
    return new rxjs.Observable<any> (observer => {
      this.hubConnection?.on("ReceiveTypingStatus", (isTyping, senderId, currentlyTypingList )=>{
        observer.next({isTyping, senderId, currentlyTypingList});
      })
    }).pipe(rxjs.takeUntil(this.destroy$))
  }
  //is typing logic

  //get latest number of private messages logic
  public getLatestNumberOfPrivateMessages = (senderId: number, receiverId: number) =>{
    this.hubConnection?.invoke("GetLatestNumberOfPrivateMessages", senderId, receiverId)
    .catch(err => console.log(err))
  }

  public receiveLatestNumberOfPrivateMessages = (): rxjs.Observable<number> =>{
    return new rxjs.Observable<number> (observer => {
      this.hubConnection?.on("UpdatedPrivateMessagesNumber", (numberOfPrivateMessages)=>{
        observer.next(numberOfPrivateMessages);
      })
    }).pipe(rxjs.takeUntil(this.destroy$))
  }

  //get latest number of private messages logic

  //get latest number of public channel messages logic
  public getLatestNumberOfPublicChannelMessages = (channelId: number, currentUserId: number) => {
    if(this.hubConnection.state == `Connected`){
    this.hubConnection?.invoke("GetLatestNumberOfPublicChannelMessages", channelId, currentUserId)
    .catch(err => console.log(err))
  }
  }

  public receiveLatestNumberOfPublicChannelMessages = (): rxjs.Observable<number> => {
    return new rxjs.Observable<number> (observer =>{
      this.hubConnection?.on("UpdatePublicChannelMessagesNumber", (numberOfPublicChannelMessages)=>{
        observer.next(numberOfPublicChannelMessages);
      })
    }).pipe(rxjs.takeUntil(this.destroy$))
  }
  //get latest number of public channel messages logic

  //test
  onTypingPrivateMessage() {
    
    const receiverId = this.privateConversationId$.getValue();
    this.senderId$.next(this.currentUserId$.getValue() as number);


    this.isUserTyping$.next(true)

    if (this.senderId$.getValue() !== null && receiverId !== undefined) {
      // Clear existing timeout
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
      }

      this.userService.getById(this.senderId$.getValue() as number).pipe(rxjs.takeUntil(this.destroy$)).subscribe(res => {
        this.userNameTyping$.next(res.firstName) 
      })
     
      this.typingStatusMap.set(this.senderId$.getValue() as number, this.userNameTyping$.getValue());
   
      // Send typing status to the server
      this.sendTypingStatus(this.isUserTyping$.getValue(), this.senderId$.getValue() as number, receiverId);

      // Set timeout to mark user as not typing after 6000ms
      this.typingTimeout = setTimeout(() => {
   

        this.typingTimeout = null;
       
        this.currentlyTypingUsers$.next(this.currentlyTypingUsers$.value.filter(userId => userId !== this.currentUserId$.getValue()));
      
     
        if(this.isUserTyping$.value == false){
          const currentStatusMap = new Map(this.typingStatusMap)
          this.typingStatusMap$.next(currentStatusMap)
        }

        this.sendTypingStatus(false, this.currentUserId$.getValue() as number, receiverId);
      }, 6000);
    }
  }

}
