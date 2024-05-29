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
import { selectCurrentlyClickedConversation } from '../state/channel/channel.selector';
import { Channels } from '../state/channel/channel.action';
import { selectIsTypingStatusIds, selectPaginatedRecordById, selectPublicMessagesNumberFromChannelId, totalPublicMessagesCount } from '../state/message/message.selector';
import { Message } from '../Models/message.model';

@Injectable({
  providedIn: 'root'
})
export class MessageService implements OnInit, OnDestroy {

  private destroy$ = new rxjs.Subject<void>();
  currentUserId$ = this.authService.userId$;

  canLoadMorePrivateMessages$ = new rxjs.BehaviorSubject<boolean>(false);
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
      tap((res)=> console.log(`service output:`,res))
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
        map(messages => messages.reverse())
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
    //console.log(`loading more public messages...`)

    
    this.store.select(selectCurrentlyClickedConversation).pipe(rxjs.take(1)).subscribe((selectedChannel) =>{
      console.log(this.canLoadMorePublicMessages$.value , selectedChannel)
    if (this.canLoadMorePublicMessages$.value !== false && selectedChannel !== undefined) {

      let startIndex = this.initialPublicMessageStartIndex$.value
      let endIndex = startIndex + 10
      this.initialPublicMessageStartIndex$.next(endIndex)
      //console.log(`startIndex from public`, startIndex)
      //console.log(`endIndex from public`, endIndex)

      /////////new implementation/////////////////
      this.store.dispatch(Messages.Hub.Actions.requestLatestNumberOfPublicMessagesByChannelIdStarted())
      this.store.dispatch(Messages.Hub.Actions.recieveLatestNumberOfPublicMessagesByChannelIdStarted())

      this.store.select(selectPublicMessagesNumberFromChannelId).pipe(
       
        rxjs.switchMap((latestNumberOfPublicMessages)=>
          this.store.select(totalPublicMessagesCount).pipe(
            
            rxjs.map((totalPublicMessagesCount) =>({latestNumberOfPublicMessages, totalPublicMessagesCount}))
          )
        )
      ).subscribe(({latestNumberOfPublicMessages, totalPublicMessagesCount})=>{
        console.log(latestNumberOfPublicMessages, totalPublicMessagesCount)
        if(latestNumberOfPublicMessages == totalPublicMessagesCount){
          this.canLoadMorePublicMessages$.next(false)
        }
   
      })
      /////////old implementation/////////////////

      //ngRx load paginated public messages to the state
      this.store.dispatch(Messages.Api.Actions.loadPaginatedPublicMessagesStarted({channelId:selectedChannel, startIndex:startIndex, endIndex:endIndex }))
      //ngRx select total paginated public messages added to the state (loaded more into the state)
      this.store.select(totalPublicMessagesCount).subscribe((res)=> console.log())


      //everything below this is redundant, I just need a mechanism for scroll and canLoadMoreMessages (can be removed)
      // this.loadPaginatedPublicMessagesById(+selectedChannel as number, startIndex, endIndex)
      //   .pipe(
      //     rxjs.take(1),
      //     rxjs.map(messages => {

      //       if (messages.length == 0) {
      //         console.log(`no more messages left to load..`)
      //         this.canLoadMorePublicMessages$.next(false)
      //         console.log(`canLoadMorePublicMessages$`, this.canLoadMorePublicMessages$.value)
      //       }

      //       return messages.map(message => {

      //         return this.extractUserName(message.sentFromUserId).pipe(
      //           rxjs.map(senderId => ({
      //             sentFromUserDTO: {
      //               id: message.sentFromUserId,
      //               firstName: senderId
      //             },
      //             body: message.body
      //           }))
      //         )
      //       })
      //     }),
      //     rxjs.switchMap(asyncOperations => {
      //       return rxjs.forkJoin(asyncOperations)
      //     }),
      //     rxjs.takeUntil(this.destroy$)
      //   ).subscribe(publicMessages => {
      //     this.receivedPublicMessages$.next([
      //       ...publicMessages,
      //       ...this.receivedPublicMessages$.value
      //     ])

      //     this.virtualScrollViewportPublic$.next(3)
      //     this.maxScrollValue$.next(endIndex - 1)

      //   })
    }
  })
  }
  // load more private messages method()
  loadMorePrivateMessages(): void {

    const [currentUserId, privateConversationId] = [this.currentUserId$.getValue(), this.privateConversationId$.getValue()]
    if (currentUserId !== null && privateConversationId !== undefined) {

      if (this.canLoadMorePrivateMessages$.value !== false && privateConversationId !== undefined) {

        let startIndex = this.initialPrivateMessageStartIndex$.value
        console.log(`start index from service:`,startIndex)
        let endIndex = startIndex + 10
        this.initialPrivateMessageStartIndex$.next(endIndex)
        console.log(`end indext from service:`, endIndex)
        
        //ngRx
        this.store.dispatch(Messages.Api.Actions.loadPaginatedPrivateMessagesStarted({
          senderId:currentUserId,
          receiverId:privateConversationId,
          startIndex:startIndex,
          endIndex:endIndex
        }))
   
      this.store.select(selectPaginatedRecordById(privateConversationId))
        .subscribe((messages) => {
          this.totalLoadedMessages = 0 
          const totalMessages = messages.length
          this.totalLoadedMessages += totalMessages
          const batches = Math.ceil( this.totalLoadedMessages / 10 )
          console.log(`TotalMessages: ${this.totalLoadedMessages}, Batches: ${batches}`);
          if(totalMessages % 10 !== 0){
            this.canLoadMorePrivateMessages$.next(false)
          }else if( totalMessages > endIndex && totalMessages % 10 !== 0 ) {
            this.canLoadMorePrivateMessages$.next(false)
          }
        })

        // //this.loadPaginatedPrivateMessages(currentUserId, privateConversationId, startIndex, endIndex)
        //   .pipe(
        //     rxjs.tap((res)=> console.log(`output test old:`, res)),
        //     rxjs.take(2),
        //     rxjs.map(messages => {
        //       if (messages.length == 0) {
        //         console.log(`no more messages left to load`)
        //         this.canLoadMorePrivateMessages$.next(false)
        //         console.log(`canLoadMore$`, this.canLoadMorePrivateMessages$.value)
        //       }
        //       return messages.map(message => {
        //         return this.extractUserName(message.sentFromUserId).pipe(
        //           rxjs.map(senderId => ({
        //             isSeen: message.isSeen,
        //             senderId: senderId,
        //             message: message.body
        //           }))
        //         )
        //       })

        //     }),
        //     rxjs.switchMap(asyncOperations => {
        //       return rxjs.forkJoin(asyncOperations)
        //     }),
        //     rxjs.takeUntil(this.destroy$))
          // .subscribe(privateMesssages => {
          //   this.receivedPrivateMessages$.next([
          //     ...privateMesssages,
          //     ...this.receivedPrivateMessages$.value
          //   ])

          //   //needs looking into to make it function properly 
          //   this.virtualScrollViewportPrivate$.next(3)
          //   this.maxScrollValue$.next(endIndex - 1)
          // })
      }
    }
  }

  // select user for private messaging directly from public chat method()
  public conversationIdSelectedClickHandler(conversationId: number): void {

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
      this.canLoadMorePrivateMessages$.next(false)
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

    this.chatService.getLatestNumberOfPrivateMessages(this.currentUserId$.getValue() as number, this.conversationId$.getValue())
    this.chatService.receiveLatestNumberOfPrivateMessages()
      .pipe(
        rxjs.first(),
        rxjs.switchMap(totalMessagesNumber => {
          this.totalPrivateConversationMessagesNumber$.next(totalMessagesNumber);

          //displays the button if there are messages to be loaded/disappears it when there arent.
          this.canLoadMorePrivateMessages$.next(totalMessagesNumber > 10);

          const startIndex = 0
          const endIndex = totalMessagesNumber - (totalMessagesNumber - 10);
          this.initialPrivateMessageStartIndex$.next(endIndex)

          //ngRx
          this.store.dispatch(Messages.Api.Actions.loadPaginatedPrivateMessagesStarted({
            senderId: this.currentUserId$.getValue() as number,
            receiverId: this.conversationId$.getValue(),
            startIndex: startIndex,
            endIndex: endIndex
          }))
          return this.store.select(selectPaginatedRecordById(this.conversationId$.getValue()))

          // return this.loadPaginatedPrivateMessages(
          //   this.currentUserId$.getValue() as number,
          //   this.conversationId,
          //   startIndex,
          //   endIndex
          // ).pipe(rxjs.first());
        }),
        rxjs.takeUntil(this.destroy$)
      )
      .subscribe(res => {
        //console.log(`old output:`,res.length)
   
        // const privateMessages: any = res.map(async (message: any) => {
        //   const senderId = await this.extractUserName(message.sentFromUserId).toPromise()
        //   return {
        //     isSeen: message.isSeen,
        //     senderId: senderId,
        //     message: message.body
        //   }
        // })
        // Promise.all(privateMessages).then((messsages: any) => {

        //   this.receivedPrivateMessages$.next(messsages)
        //   //console.log(this.messageService.receivedPrivateMessages$.value)
        // })
      });
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
