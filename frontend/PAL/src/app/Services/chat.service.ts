import { Injectable, OnDestroy, OnInit } from '@angular/core';
import * as rxjs from 'rxjs';
import { AuthService } from './auth.service';
import { User, UserService } from './user.service';
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

  ///// Hub methods /////

  //send notification of received message
  public notifyReceiverOfPrivateMessage = (object:any) => {
    this.hubConnection?.invoke("NotifyReceiverOfPrivateMessage", object)
    .catch(err => console.log(err))  
  }

  //recieve confirmation that the private message has been seen
  public privateMessageReceived = (): rxjs.Observable<any> => {
    return new rxjs.Observable<any> (observer => {
      this.hubConnection?.on("PrivateMessageReceived", (privateMessage)=>{
        observer.next(privateMessage)
      })
    }).pipe(rxjs.takeUntil(this.destroy$))
  }


  //send `is typing` status
  public sendTypingStatus = (
    isTyping:boolean, 
    senderId: number, 
    receiverId:number
    ) =>{
    this.hubConnection?.invoke("SendTypingStatus", isTyping, senderId, receiverId )
    .catch(err => console.log(err))
  }

  //recieve `is typing` status
  public receiveTypingStatus = (): rxjs.Observable<any> => {
    return new rxjs.Observable<any> (observer => {
      this.hubConnection?.on("ReceiveTypingStatus", (isTyping, senderId, currentlyTypingList )=>{
        observer.next({isTyping, senderId, currentlyTypingList});
      })
    }).pipe(rxjs.takeUntil(this.destroy$))
  }
 

  // get latest number of private messages logic
  public getLatestNumberOfPrivateMessages = (senderId: number, receiverId: number) =>{
    this.hubConnection?.invoke("GetLatestNumberOfPrivateMessages", senderId, receiverId)
    .catch(err => console.log(err))
  }

  // recieve latest number of private messages logic
  public receiveLatestNumberOfPrivateMessages = (): rxjs.Observable<number> =>{
    return new rxjs.Observable<number> (observer => {
      this.hubConnection?.on("UpdatedPrivateMessagesNumber", (numberOfPrivateMessages)=>{
        observer.next(numberOfPrivateMessages);
      })
    }).pipe(rxjs.takeUntil(this.destroy$))
  }

 

  // get latest number of public channel messages 
  public getLatestNumberOfPublicChannelMessages = (channelId: number, currentUserId: number) => {
    if(this.hubConnection.state == `Connected`){
    this.hubConnection?.invoke("GetLatestNumberOfPublicChannelMessages", channelId, currentUserId)
    .catch(err => console.log(err))
  }
  }

  // recieve latest number of public channel messages 
  public receiveLatestNumberOfPublicChannelMessages = (): rxjs.Observable<number> => {
    return new rxjs.Observable<number> (observer =>{
      this.hubConnection?.on("UpdatePublicChannelMessagesNumber", (numberOfPublicChannelMessages)=>{
        observer.next(numberOfPublicChannelMessages);
      })
    }).pipe(rxjs.takeUntil(this.destroy$))
  }
  
  ///// Hub methods /////

  ///// Additional helper methods /////

  // typing event method
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

  ///// Additional helper methods /////
}
