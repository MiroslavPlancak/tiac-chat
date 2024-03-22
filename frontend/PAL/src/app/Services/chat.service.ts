import { Injectable, OnDestroy, OnInit } from '@angular/core';
import * as rxjs from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';
import { User, UserService } from './user.service';
import { ChannelService } from './channel.service';
import { NotificationDialogService } from './notification-dialog.service';
import { MessageService } from './message.service';

export interface PrivateMessage {
  isSeen: boolean
  senderId: string
  message: string
}

@Injectable({
  providedIn: 'root'
})

export class ChatService implements OnInit,OnDestroy {

  public hubConnection: signalR.HubConnection;
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
  userNameTyping$ = new rxjs.BehaviorSubject<string>('')

  privateNotification: { [userId: number]: boolean } = {}
  privateConversationId$ = new rxjs.BehaviorSubject<number | undefined>(undefined)


  public onlineUserIdsWithoutSelf$ = rxjs.combineLatest([
    this.onlineUserIds$.pipe(rxjs.takeUntil(this.destroy$)),
    this.authService.userId$.pipe(rxjs.takeUntil(this.destroy$))
  ])
    .pipe(

      rxjs.map(([onlineUserIds, currentUserId]) => onlineUserIds.filter(onlineUserId => onlineUserId !== currentUserId)),
      //rxjs.tap(res => console.log(`onlineUserIdsWithtoutSelf$`, res))
      rxjs.takeUntil(this.destroy$)
    )

  
  
  public allUsers$ = this.userService.getAllUsers().pipe(
   //rxjs.tap(res => console.log(`allUsers$/chat.service.ts:`, res))
   rxjs.takeUntil(this.destroy$)
  );



 //private channels
 public getAllPrivateChannelsByUserId$ = this.currentUserId$.pipe(
  rxjs.filter(currentUserId => currentUserId != undefined),
  rxjs.switchMap(currentUserId => {
    return this.channelService.getListOfPrivateChannelsByUserId(currentUserId as number).pipe(
    
      rxjs.map(privatelyOwnedChannels => {
        
        return privatelyOwnedChannels.map((channel: { createdBy: number; }) =>
          ({ ...channel, isOwner: channel.createdBy === currentUserId }))
      })
    )
  }),
  rxjs.takeUntil(this.destroy$)
);


  public latestPrivateChannels$ = rxjs.combineLatest([
    this.getAllPrivateChannelsByUserId$,
    this.newlyCreatedPrivateChannel$,
    this.removeChannelId$
  ]).pipe(
    rxjs.map(([getAllPrivateChannelsByUserId, newlyCreatedPrivateChannel, removeChannelId]) => {
      
      return [
        ...getAllPrivateChannelsByUserId,
        ...newlyCreatedPrivateChannel
      ];
    }),
    rxjs.takeUntil(this.destroy$),
    rxjs.tap(res => console.log(/*`87.latestPrivateChannels$:`, res*/)),
   
  );

  //public channels
  public allPublicChannels$ = this.channelService.getListOfChannels().pipe(
    rxjs.map(publicChannels => publicChannels.filter((channel: { visibility: number; }) => channel.visibility !== 0)),
    rxjs.takeUntil(this.destroy$)
  )

  public latestPublicChannels$ = rxjs.combineLatest([
    this.allPublicChannels$,
    this.newlyCreatedPublicChannel$
  ]).pipe(
    rxjs.map(([allPublicChannels, newlyCreatedChannel]) => [
      ...allPublicChannels,
      ...newlyCreatedChannel
    ]),
    rxjs.takeUntil(this.destroy$)
//    rxjs.tap(channels => console.log('Latest public channels:', channels))
  )


  //////////////////////////

  public onlineUsers$ = rxjs.combineLatest([
    this.onlineUserIdsWithoutSelf$,
    this.userService.allUsersSubject$,

  ]).pipe(
    rxjs.map(([onlineUserIds,allUsers]) => {
     
      return allUsers.filter(user => onlineUserIds.includes(user.id))
    }),
//   rxjs.tap(res => console.log(`onlineUsers$/chat.service.ts:`,res)),
    rxjs.takeUntil(this.destroy$)
  )

  public offlineUsers$ = rxjs.combineLatest([

    //if offline list is not filtering correctly its is due to this change, return -onlineUserIdsWithoutSelf$
    this.onlineUserIds$,
    this.userService.allUsersSubject$,
    
  ]).pipe(
    rxjs.map(([onlineUserIds, allUsers]) => {
      return allUsers.filter(user => !onlineUserIds.includes(user.id))
    }),
    rxjs.takeUntil(this.destroy$)
  )
  typingTimeout: any;



  constructor(
    private authService: AuthService,
    private userService: UserService,
    private channelService: ChannelService,
    private dialogService: NotificationDialogService,
   

  ) {
    //#this
  
    this.getAllPrivateChannelsByUserId$
    .pipe(rxjs.takeUntil(this.destroy$))
    .subscribe(/*console.log(`getAllPrivateChannelsByUserId$ constructor`,res)*/)
    
    
    console.log(`currentUserId$`, this.currentUserId$.getValue())
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5008/Chathub', {
        accessTokenFactory: () => {
          const token = this.authService.getAccessToken();
          if (token) {
            return token;
          }
          throw new Error("Cannot establish connection without access token.");
        }
      })
      .build();

    this.authService.loggedOut$.subscribe((isLoggedOut) => {
      if (isLoggedOut) {
        this.hubConnection.stop()
        this.destroy$.next()
      }
    })


    this.hubConnection
      .start()
      .then(() => {

        if (this.hubConnection.connectionId != undefined) {

          console.log("connection started with connectionId:", this.hubConnection.connectionId);
        
        }
        
      })
      .catch(err => {
        console.log('Error while starting connection:' + err)
      })


    this.hubConnection.on("YourConnectionId", (connection: Record<string, string>, userId: number, fullName:string) => {
      console.log(`new connection established:${JSON.stringify(connection)}`);

    this.userService.getAllUsersBS$()
    .pipe(rxjs.takeUntil(this.destroy$))
    .subscribe(res => console.log( /*`getAllUsersBS$: chat.service.ts constructor`,res*/));
      
      const userIds = Object.keys(connection).map(strUserId => +strUserId);
      this.onlineUserIds$.next(userIds);
//      console.log(`onlineUserIds$`, this.onlineUserIds$.getValue(), userId)

      if(this.currentUserId$.getValue() !== userId){
        
      this.dialogService.openOnlineNotification(
        `${fullName} just came online.`,
        ``,
        ``,
        {top:`0%`,left:`80%`},
        3000 
      )}
    
    })

    this.hubConnection.on('UserDisconnected', (connections, userId, fullName) => {
      const userIds = Object.keys(connections).map(userId => +userId)
      this.onlineUserIds$.next(userIds);

      if(this.currentUserId$.getValue() !== userId){
        
        this.dialogService.openOnlineNotification(
          `${fullName} just went offline.`,
          ``,
          ``,
          {top:`0%`,left:`80%`},
          3000 
        )}
      
    })

    this.hubConnection.onclose((error) => {
      console.log('Connection closed.');
      console.log(error);
    });





    //add user to private conversation
    this.hubConnection.on('YouHaveBeenAdded', (channelId, userId,entireChannel) => {
      console.log(`You have been added to private channel ${channelId} by ${userId}`)
      this.newlyCreatedPrivateChannel$.next([...this.newlyCreatedPrivateChannel$.value, entireChannel])

      this.dialogService.openNotificationDialog(
        `joined private channel`,
        `You have been added to private channel ${entireChannel.name}`,
        `Close`
      )
     
    })

    //kick user from private conversation    
    this.hubConnection.on('YouHaveBeenKicked', (channelId,userId) => {

      console.log(`You have been kicked from private channel: ${channelId}/${userId}`);
      const updateChannelList = this.newlyCreatedPrivateChannel$.value.filter(
        (channel: {id: number | null})=> 
         channel.id !== channelId 
       )
      //here I need to remove the user from the private channel that has no more access  as he has been kicked
      this.newlyCreatedPrivateChannel$.next(updateChannelList)
      this.removeChannelId$.next(channelId)

      this.dialogService.openNotificationDialog(
        `Kicked from private channel`,
        `You have been kicked from private channel ${channelId}`,
        `Close`
      )
    });

  //create new channel
    this.hubConnection.on("NewChannelCreated", (newChannel) => {
      console.log('new channel from constructor of chat service:', newChannel)
      if (newChannel.visibility === 1) {

        this.newlyCreatedPublicChannel$.next([...this.newlyCreatedPublicChannel$.value, newChannel])

      }
      else if (newChannel.visibility === 0) {
        const newPrivateChannel = 
        {
          ...newChannel,
          isOwner: true
        }
        this.newlyCreatedPrivateChannel$.next([...this.newlyCreatedPrivateChannel$.value, newPrivateChannel])
      }
    })

 

  }


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
    // console.log(this.privateConversationId$.getValue())
    // console.log(this.senderId$.getValue())
    this.isUserTyping$.next(true)
    //let userName = '';
    //console.log('Typing started for receiverId:', senderId, receiverId, isTyping);

    if (this.senderId$.getValue() !== null && receiverId !== undefined) {
      // Clear existing timeout
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
      }

      //this  was causing the problem IMPORTANT 
      //this.typingStatusMap.clear()
      //this  was causing the problem IMPORTANT 
      // Update typing status map
      this.userService.getById(this.senderId$.getValue() as number).pipe(rxjs.takeUntil(this.destroy$)).subscribe(res => {
        this.userNameTyping$.next(res.firstName) 
      })
     // console.log(`firstname`,this.userNameTyping$.getValue())
      this.typingStatusMap.set(this.senderId$.getValue() as number, this.userNameTyping$.getValue());
     // console.log(`tping status map:`,this.typingStatusMap)
      // Send typing status to the server
      this.sendTypingStatus(this.isUserTyping$.getValue(), this.senderId$.getValue() as number, receiverId);

      // Set timeout to mark user as not typing after 6000ms
      this.typingTimeout = setTimeout(() => {
        this.currentlyTypingUsers$.next([])
        this.typingTimeout = null;
        this.typingStatusMap.delete(this.senderId$.getValue() as number);
        this.sendTypingStatus(false, this.senderId$.getValue() as number, receiverId);
      }, 3000);
    }
  }

}
