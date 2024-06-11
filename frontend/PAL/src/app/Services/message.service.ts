import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, BehaviorSubject } from 'rxjs';
import { ChatService, PrivateMessage } from './chat.service';
import * as rxjs from 'rxjs';
import { ChannelService } from './channel.service';
import { UserService } from './user.service';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { AuthService } from './auth.service';
import { ConnectionService } from './connection.service';
import { Store } from '@ngrx/store';
import { Users } from '../state/user/user.action'
import { Messages } from '../state/message/message.action';
import { selectUserById, selectConnectedUsers } from '../state/user/user.selector';
import { selectCurrentlyClickedPrivateConversation, selectCurrentlyClickedPublicConversation, selectCurrentlyLoggedUser } from '../state/channel/channel.selector';
import { Channels } from '../state/channel/channel.action';
import { privateMessagesStartEndIndex, selectCanLoadMorePrivateMessages, selectCanLoadMorePublicMessages, selectIsTypingStatusIds, selectPaginatedRecordById, selectPrivateMessagesNumberFromReceiverId, selectPublicMessagesNumberFromChannelId, totalPrivateMessagesCount, totalPublicMessagesCount } from '../state/message/message.selector';
import { Message } from '../Models/message.model';

@Injectable({
  providedIn: 'root'
})
export class MessageService implements OnInit, OnDestroy {

  private destroy$ = new rxjs.Subject<void>();
  currentUserId$ = this.authService.userId$;

  canLoadMorePrivateMessages$ = new rxjs.BehaviorSubject<boolean>(true);
  canLoadMorePublicMessages$ = new rxjs.BehaviorSubject<boolean>(false);

  initialPublicMessageStartIndex$ = new rxjs.BehaviorSubject<number>(0);
  initialPrivateMessageStartIndex$ = new rxjs.BehaviorSubject<number>(0);

  public totalPublicChannelMessagesNumber$ = new rxjs.BehaviorSubject<number>(0);
  public totalPrivateConversationMessagesNumber$ = new rxjs.BehaviorSubject<number>(0);

  receivedPublicMessages$ = new rxjs.BehaviorSubject<any[]>([]);
  receivedPrivateMessages$ = new rxjs.BehaviorSubject<PrivateMessage[]>([]);

  privateConversationId$ = this.chatService.privateConversationId$
  privateMessageSeenStatus$ = new rxjs.BehaviorSubject<boolean>(false)
  isDirectMessage = new rxjs.BehaviorSubject<boolean>(false);
  isDirectMessageOffline = new rxjs.BehaviorSubject<boolean>(false);

  //SelectedChannel$ = this.channelService.SelectedChannel$

  endScrollValue$ = new rxjs.BehaviorSubject<number>(0);
  maxScrollValue$ = new rxjs.BehaviorSubject<number>(0);
  virtualScrollViewportPublic$ = new rxjs.BehaviorSubject<number>(0);
  virtualScrollViewportPrivate$ = new rxjs.BehaviorSubject<number>(0);
  private virtualScrollViewport: CdkVirtualScrollViewport | undefined;

  public conversationId$ = new rxjs.BehaviorSubject<number>(8)
  selectedConversation = this.channelService.selectedConversation$

   initialPrivateMessages: PrivateMessage[] = [];

  privateMessageCounter$ = new rxjs.BehaviorSubject<PrivateMessage[]>(this.initialPrivateMessages);
  privateMessageMap$ = new rxjs.BehaviorSubject<Map<number,number>>(new Map<number,number>)
  privateMessageMap = new Map<number, number>()

   totalLoadedMessages:number = 0;

  private apiUrl = "http://localhost:5008/api/messages/";



  constructor(
    private http: HttpClient,
    private channelService: ChannelService,
    private userService: UserService,
    private authService: AuthService,
    private chatService: ChatService,
    private connectionService: ConnectionService,
    private store: Store
  ) {    }
  ngOnInit(): void {
 
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }



  ///// HTTP end point methods /////

  loadPaginatedPrivateMessages
    (senderId: number,
      receiverId: number,
      startIndex: number,
      endIndex: number
    ): Observable<any[]> {
    const fullPath = `getPaginatedPrivateMessages?senderId=${senderId}&receiverId=${receiverId}&startIndex=${startIndex}&endIndex=${endIndex}`;
    return this.http.get<PrivateMessage[]>(this.apiUrl + fullPath).pipe(
      map(messages => messages.reverse()),
      // tap((res) => console.log(`service output:`, res))
    )
  }

  loadPublicMessages(): Observable<any> {
    return this.http.get(this.apiUrl + 'getAll');

  }

  loadMessagesByChannelId(channelId: number): Observable<any> {
    return this.http.get(this.apiUrl + 'getMessagesByChannelId?channelId=' + channelId);
  }

  loadPaginatedPublicMessagesById
    (
      channelId: number,
      startIndex: number,
      endIndex: number
    ): Observable<any[]> {
    return this.http.get<Observable<any>[]>
      (this.apiUrl + `getPaginatedPublicChannelMessages?channelId=${channelId}&startIndex=${startIndex}&endIndex=${endIndex}`)
      .pipe(
        map(messages => messages.reverse()),
        // rxjs.tap(()=>console.log(`api happens`))
      )
  }

  loadPrivateMessages(senderId: number, receiverId: number): Observable<any> {
  
    if (receiverId !== undefined) {
      return this.http.get(this.apiUrl, {
        params: {
          senderId,
          receiverId
        }
      })
    }
    else {
      throw new Error();
    }
  }

  loadPrivateChannelMessages(senderId: number, receiverId: number, channelId: number): Observable<any> {
    if (receiverId !== undefined && channelId !== undefined) {
      return this.http.get(this.apiUrl, {
        params: {
          senderId,
          receiverId,
          channelId
        }
      })
    } else {
      throw new Error();
    }
  }

  ///// HTTP end point methods /////

  ///// Hub methods /////

  /// send public message ()
  public sendMessage = (user: number, message: Message, selectedChannel: number) => {
   
    return rxjs.of(
        this.connectionService.hubConnection?.invoke("SendPublicMessageTest", user, message.body, selectedChannel)
    ).pipe(
        rxjs.tap(() => console.log('public message sent successfully')),
        rxjs.catchError(err => {
            console.log('Error sending public message:', err);
            return rxjs.throwError(err);
        })
    );
}
  /// recieve public message()
  public receiveMessage = (): rxjs.Observable<any> => {
    return new rxjs.Observable<any>(observer => {
      this.connectionService.hubConnection?.on("ReceiveMessage", (message,channelId) => {
        observer.next({message,channelId});
      })
    }).pipe(rxjs.takeUntil(this.destroy$))
  }

  /// send private message()
  public sendPrivateMessage = (
    recipientId: number | null | undefined,
    message: string) => {
   return rxjs.of( this.connectionService.hubConnection?.invoke("SendPrivateMessage", recipientId, message))
   .pipe(
 
    rxjs.catchError(err => {
      console.log(err);
      return (err);
    })
  );
  }

  /// recieve private message()
  public receivePrivateMesages = (): rxjs.Observable<any> => {
    return new rxjs.Observable<any>(observer => {
      this.connectionService.hubConnection?.on("ReceivePrivateMessages", (senderId, message, messageId, isSeen, savedMessage) => {
        //console.log(`savedPrivateMessage#1:`, savedMessage)
        //observer.next({ senderId, message, isSeen });
       
        observer.next({savedMessage,senderId});
        
      })
    })
  }

  ///// Hub methods /////

  ///// Service methods /////

  // load more public messages method()
  loadMorePublicMessages() {
    rxjs.combineLatest([
      this.store.select(selectCurrentlyClickedPublicConversation).pipe(rxjs.take(1)),
      this.store.select(selectCanLoadMorePublicMessages).pipe(rxjs.take(1))
    ]).pipe(
      rxjs.take(1),
      rxjs.filter(([selectedChannel, canLoadMorePublicMessages]) => 
        selectedChannel !== undefined && canLoadMorePublicMessages === true
      ),
      rxjs.tap(([selectedChannel]) => {
        // console.log(`selected channel`, selectedChannel);
        const startIndex = this.initialPublicMessageStartIndex$.value;
        const endIndex = startIndex + 10;
        this.initialPublicMessageStartIndex$.next(endIndex);
  
        // Dispatch action to load paginated public messages
        this.store.dispatch(Messages.Api.Actions.loadPaginatedPublicMessagesStarted({
          channelId: Number(selectedChannel),
          startIndex: startIndex,
          endIndex: endIndex
        }));
      }),
      rxjs.switchMap(() => 
        this.store.select(totalPublicMessagesCount).pipe(
          // Wait for the state to update with new messages
          rxjs.filter(totalPublicMessagesCount => totalPublicMessagesCount > 0)
        )
      ),
      rxjs.tap(() => {
        // Dispatch actions after the state has updated
        this.store.dispatch(Messages.Hub.Actions.requestLatestNumberOfPublicMessagesByChannelIdStarted());
        this.store.dispatch(Messages.Hub.Actions.recieveLatestNumberOfPublicMessagesByChannelIdStarted());
      }),
      rxjs.takeUntil(this.destroy$)
    ).subscribe();
  }
  

  // load more private messages method()
  loadMorePrivateMessages(): void {
     
    console.log(`load more...`)
    rxjs.combineLatest([
      this.store.select(selectCurrentlyClickedPrivateConversation).pipe(rxjs.take(1)),
      this.store.select(selectCanLoadMorePrivateMessages).pipe(rxjs.take(1)),
      this.store.select(selectCurrentlyLoggedUser).pipe(rxjs.take(1)),
      this.store.select(privateMessagesStartEndIndex).pipe(rxjs.take(1))
    ]).pipe(
      //optional
      
      rxjs.filter(([selectedPrivateConversation, canLoadMorePrivateMessages, selectCurrentlyLoggedUser ])=>{
       // console.log(selectedPrivateConversation , canLoadMorePrivateMessages ,selectCurrentlyLoggedUser)
       return selectedPrivateConversation !== undefined  && canLoadMorePrivateMessages == true && selectCurrentlyLoggedUser !==undefined
      }),
      rxjs.tap(([selectedPrivateConversation, canLoadMorePrivateMessages, selectCurrentlyLoggedUser, pagination])=>{
        //old
        //here is the problem
        let startIndex = pagination.endIndex
        // console.log(`night startIndex:`, startIndex)
        let endIndex = startIndex + 10
        // console.log(`night endIndex:`, endIndex)
        
        this.store.dispatch(Messages.Flag.Actions.setStartEndIndexFlagStarted({ startIndex: startIndex, endIndex: endIndex}))
        //this.initialPrivateMessageStartIndex$.next(endIndex)
        // console.log(`selectCurrentlyLoggedUser`,selectCurrentlyLoggedUser)
        // console.log(`selectedPrivateConversation`, selectedPrivateConversation)
        this.store.dispatch(Messages.Api.Actions.loadPaginatedPrivateMessagesStarted({
          senderId:Number(selectCurrentlyLoggedUser),
          receiverId:Number(selectedPrivateConversation),
          startIndex:startIndex,
          endIndex:endIndex
        }))
        return endIndex
        }),
        rxjs.switchMap(([selectedPrivateConversation, canLoadMorePrivateMessages, selectCurrentlyLoggedUser, pagination])=>
          {
           
            const endIndex = pagination.endIndex
            return this.store.select(totalPrivateMessagesCount).pipe(
            rxjs.take(2),
            rxjs.filter(totalPrivateMessagesCount => totalPrivateMessagesCount > 0),
            rxjs.tap((totalPrivateMessagesCount)=>{
              console.log(`debug/totalPrivateMessagesCount:`, totalPrivateMessagesCount)
              // console.log(endIndex)
              if(totalPrivateMessagesCount < Number(endIndex)){
                console.log(`this runs`)
                this.store.dispatch(Messages.Flag.Actions.setCanLoadMorePrivateMessagesFlagStarted({ canLoadMore: false }))
              }
            })
          )
        }),
        rxjs.tap(() => {
          this.store.dispatch(Messages.Hub.Actions.requestLatestNumberOfPrivateMessagesByReceiverIdStarted())
          this.store.dispatch(Messages.Hub.Actions.recieveLatestNumberOfPrivateMessagesByReceiverIdStarted())
        }),
        rxjs.takeUntil(this.destroy$)  
    ).subscribe()

   
  }

  // select user for private messaging directly from public chat method()
  public conversationIdSelectedClickHandler(conversationId: number): void {
//    console.log(`click`)
    //reset the start/end indexes in the state
    this.store.dispatch(Messages.Flag.Actions.resetStartEndIndexFlagStarted())
    
    //set the clicked private conversation flag in the state
    this.store.dispatch(Channels.Api.Actions.loadPrivateChannelByIdStarted({ channelId: conversationId}))
    
    //this.store.select(selectCurrentlyClickedPrivateConversation).pipe(rxjs.take(2)).subscribe()
    //ngRx clear private messages state
    this.store.dispatch(Messages.Api.Actions.clearPaginatedPrivateMessagesStarted({ userId: conversationId }))
    
    // reset the private message counter and clear the map (un-read messages counter logic)
    this.privateMessageCounter$.next([])
    this.privateMessageMap$.getValue().forEach((value,key,map)=>{
      map.delete(conversationId)
    })

    
    // these if statements ensure proper clean up of `is typing` if a different conversation is selected
    // const currentlyTypingFilteredConvoId = this.chatService.currentlyTypingUsers$.value.filter(correctUser => correctUser !== conversationId)
   
    // if (+currentlyTypingFilteredConvoId !== conversationId) {
    //   this.chatService.sendTypingStatus(false, this.currentUserId$.getValue() as number, +currentlyTypingFilteredConvoId)
    // }

        this.store.dispatch(Messages.Hub.Actions.sendIsTypingStatusStarted({
          isTyping: false,
          senderId: Number(this.currentUserId$.getValue()),
          receiverId: this.selectedConversation.getValue()
        }))
     
    
    // if (this.chatService.currentlyTypingUsers$.value.length == 0) {
    //   this.chatService.sendTypingStatus(false, this.currentUserId$.getValue() as number, this.selectedConversation.getValue());
    // }

    this.conversationId$.next(conversationId)

    //make self unclickable in a public chat
    if (conversationId !== this.currentUserId$.getValue()) {
      
      //this was causing the improper loading
      this.initialPublicMessageStartIndex$.next(0)
      //this.canLoadMorePrivateMessages$.next(false)
      //this was causing the improper loading

      this.getConcurrentNumberOfMessages();

      //dissapearing `write to Client` logic is solved by filtering the private conversations by senderID not being equal to currently clicked conversationId
      if (this.chatService.senderId$.value !== conversationId) {
        this.chatService.isUserTyping$.next(false)
      }

      if (this.currentUserId$.value !== conversationId) {
        this.store.dispatch(Channels.Flag.Actions.loadCurrentlyClickedConversationStarted({ conversationId: undefined }))
        //this.channelService.SelectedChannel$.next(undefined);
      }

      this.isDirectMessage.next(true)
      //this.channelService.isPrivateChannel$.next(false)
      this.chatService.privateNotification[conversationId] = false;

      this.seenMessageStatus()

      if (conversationId !== this.currentUserId$.getValue()) {
        this.privateConversationId$.next(conversationId);
      }

      this.displayUserNameToWriteTo()

    }
  }

  getConcurrentNumberOfMessages(): void {
   // console.log(`initial loading of private messages`)


    //ngRx foothold
    this.store.dispatch(Messages.Hub.Actions.requestLatestNumberOfPrivateMessagesByReceiverIdStarted())
    this.store.dispatch(Messages.Hub.Actions.recieveLatestNumberOfPrivateMessagesByReceiverIdStarted())
    

   // this.chatService.getLatestNumberOfPrivateMessages(this.currentUserId$.getValue() as number, this.conversationId$.getValue())
   this.store.select(selectPrivateMessagesNumberFromReceiverId)
      .pipe(
        rxjs.filter(loadedMessagesNumber => !!loadedMessagesNumber),
      rxjs.take(1),
        
        rxjs.switchMap(privateMessagesNumber => {
         // console.log(`debug/privateMessagesNumber`,privateMessagesNumber)
          if(privateMessagesNumber > 10){
            this.store.dispatch(Messages.Flag.Actions.setCanLoadMorePrivateMessagesFlagStarted({canLoadMore: true}))
           }else{
             this.store.dispatch(Messages.Flag.Actions.setCanLoadMorePrivateMessagesFlagStarted({canLoadMore: false}))
           }
          // this.totalPrivateConversationMessagesNumber$.next(privateMessagesNumber);

          //displays the button if there are messages to be loaded/disappears it when there arent.
          // this.canLoadMorePrivateMessages$.next(privateMessagesNumber > 10);
          
          const startIndex = 0
          const endIndex = privateMessagesNumber - (privateMessagesNumber - 10);
       //  console.log(`Initial start index:`, startIndex , `Initial end index:`, endIndex, `Initial senderId`, this.currentUserId$.getValue(), `Initial receiverId`, this.conversationId$.getValue())
          this.store.dispatch(Messages.Flag.Actions.setStartEndIndexFlagStarted({ startIndex: startIndex, endIndex: endIndex}))
          
          // this.initialPrivateMessageStartIndex$.next(endIndex)
          // console.log(`initialPrivatemessageStartIndex$ night:`, this.initialPrivateMessageStartIndex$.getValue())
          //ngRx

          this.store.dispatch(Messages.Api.Actions.loadPaginatedPrivateMessagesStarted({
            senderId: this.currentUserId$.getValue() as number,
            receiverId: this.conversationId$.getValue(),
            startIndex: startIndex,
            endIndex: endIndex
          }))
          console.log(`this runs`)
          return this.store.select(selectPaginatedRecordById(this.conversationId$.getValue())).pipe(rxjs.take(1))

          // return this.loadPaginatedPrivateMessages(
          //   this.currentUserId$.getValue() as number,
          //   this.conversationId,
          //   startIndex,
          //   endIndex
          // ).pipe(rxjs.first());
        }),
        rxjs.takeUntil(this.destroy$)
      )
      .subscribe(res => {});
  }

  seenMessageStatus(): void {

    this.loadPrivateMessages(this.currentUserId$.getValue() as number, this.conversationId$.getValue()).pipe(
      rxjs.first(),
      rxjs.map(allMessages => allMessages.filter((message: { isSeen: boolean; }) => !message.isSeen)),
      rxjs.takeUntil(this.destroy$)
    ).subscribe(filteredUnSeenMessages => {
      filteredUnSeenMessages.forEach((unSeenMessage: any) => {
        this.chatService.notifyReceiverOfPrivateMessage(unSeenMessage)
      });
    }
    )
  }


  displayUserNameToWriteTo(): void {
   
    this.store.select(selectConnectedUsers).pipe(
      rxjs.first(),
      rxjs.map(users => users.find(user => user.id === this.conversationId$.getValue())),
      rxjs.takeUntil(this.destroy$)
    ).subscribe(user => {
      if (user) {
        this.selectedConversation.next(user.id)
        this.userService.writingTo.next(`${user.firstName} ${user.lastName}`);
        this.userService.fullName = `write to ${user.firstName}:`
      }
    })
  }


  extractUserName(sentFromUserId: any): rxjs.Observable<string> {
    
    this.store.dispatch(Users.Api.Actions.loadUserByIdStarted({ userId:sentFromUserId}))

    return this.store.select(selectUserById).pipe(
      //this basically waits for the users to be loaded into the reducer state before proceeding down the pipe
      //without it we get 'loading': message
      rxjs.filter(users => users.some(user => user.id === sentFromUserId)), 
      rxjs.take(1),                            
      map(users => {
        const currentUser = users.find(user => user.id === sentFromUserId);
        return currentUser ? currentUser.firstName : 'loading'; 
      })
    );

  }

  //setter and getter for the viewport
  setVirtualScrollViewport(virtualScrollViewport: CdkVirtualScrollViewport): void {
    this.virtualScrollViewport = virtualScrollViewport;
  }

  getVirtualScrollViewport(): CdkVirtualScrollViewport | undefined {
    return this.virtualScrollViewport;
  }

  scrollToEndPrivate(index: number): void {
    //console.log(`this runs`, index)
   // console.log(`and virtual scroll is:`, this.getVirtualScrollViewport())
    this.getVirtualScrollViewport()?.scrollToIndex(index)
  }
  
  ///// Service methods /////
}
