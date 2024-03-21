import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, BehaviorSubject } from 'rxjs';
import { ChatService, PrivateMessage } from './chat.service';
import * as rxjs from 'rxjs';
import { ChannelService } from './channel.service';
import { UserService } from './user.service';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { AuthService } from './auth.service';

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

  SelectedChannel$ = this.channelService.SelectedChannel$

  endScrollValue$ = new rxjs.BehaviorSubject<number>(0);
  maxScrollValue$ = new rxjs.BehaviorSubject<number>(0);
  virtualScrollViewportPublic$ = new rxjs.BehaviorSubject<number>(0);
  virtualScrollViewportPrivate$ = new rxjs.BehaviorSubject<number>(0);
  private virtualScrollViewport : CdkVirtualScrollViewport | undefined;

  private apiUrl = "http://localhost:5008/api/messages/";

  

  constructor(
    private http: HttpClient,
    private channelService: ChannelService,
    private userService: UserService,
    private authService: AuthService, 
    private chatService: ChatService
  ) { }
  ngOnInit(): void {
  
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  //setter and getter for the viewport
  setVirtualScrollViewport(virtualScrollViewport: CdkVirtualScrollViewport): void {
    this.virtualScrollViewport = virtualScrollViewport;
  }

  getVirtualScrollViewport(): CdkVirtualScrollViewport | undefined {
    return this.virtualScrollViewport;
  }

  scrollToEndPrivate(index: number): void {
  console.log(`this runs`,index)
  console.log(`and virtual scroll is:`, this.getVirtualScrollViewport())
    this.getVirtualScrollViewport()?.scrollToIndex(index)
  }
  
  scrollToEndPrivateTest(index: number): void {
    console.log(`this runs`,index)
    console.log(`and virtual scroll is:`, this.getVirtualScrollViewport())
      this.getVirtualScrollViewport()?.scrollToIndex(index)
    }

  loadPaginatedPrivateMessages
    (senderId: number,
      receiverId: number,
      startIndex: number,
      endIndex: number
    ): Observable<any[]> {
    const fullPath = `getPaginatedPrivateMessages?senderId=${senderId}&receiverId=${receiverId}&startIndex=${startIndex}&endIndex=${endIndex}`;
    return this.http.get<PrivateMessage[]>(this.apiUrl + fullPath).pipe(
      map(messages => messages.reverse())
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
    //return this.http.get(this.apiUrl+`sender:${senderId}receiver:${receiverId}`);
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


  loadMorePublicMessages() {
    console.log(`loading more public messages...`)

    const selectedChannelId = this.SelectedChannel$.value

    if (this.canLoadMorePublicMessages$.value !== false && selectedChannelId !== undefined) {

      let startIndex = this.initialPublicMessageStartIndex$.value
      let endIndex = startIndex + 10
      this.initialPublicMessageStartIndex$.next(endIndex)
      console.log(`startIndex from public`, startIndex)
      console.log(`endIndex from public`, endIndex)
      this.loadPaginatedPublicMessagesById(+selectedChannelId as number, startIndex, endIndex)
        .pipe(
          rxjs.take(1),
          rxjs.map(messages => {

            if (messages.length == 0) {
              console.log(`no more messages left to load..`)
              this.canLoadMorePublicMessages$.next(false)
              console.log(`canLoadMorePublicMessages$`, this.canLoadMorePublicMessages$.value)
            }

            return messages.map(message => {

              return this.extractUserName(message.sentFromUserId).pipe(
                rxjs.map(senderId => ({
                  sentFromUserDTO: {
                    id: message.sentFromUserId,
                    firstName: senderId
                  },
                  body: message.body
                }))
              )
            })
          }),
          rxjs.switchMap(asyncOperations => {

            return rxjs.forkJoin(asyncOperations)
          }),
          rxjs.takeUntil(this.destroy$)
        ).subscribe(publicMessages => {
          this.receivedPublicMessages$.next([
            ...publicMessages,
            ...this.receivedPublicMessages$.value
          ])

          //this logic needs to be looked at and made function correctly.
          //this.virtualScrollViewportPublic.scrollToIndex(2)
          this.virtualScrollViewportPublic$.next(3)

          //this logic needs to be looked at and made function correctly.
          
          this.maxScrollValue$.next(endIndex - 1)
         
        })
    }
  }

  loadMorePrivateMessages(): void {
    //    console.log('loading more private messages...')
        const [currentUserId, privateConversationId] = [this.currentUserId$.getValue(), this.privateConversationId$.getValue()]
        if (currentUserId !== null && privateConversationId !== undefined) {
    
          if (this.canLoadMorePrivateMessages$.value !== false && privateConversationId !== undefined) {
            let startIndex = this.initialPrivateMessageStartIndex$.value
            let endIndex = startIndex + 10
            this.initialPrivateMessageStartIndex$.next(endIndex)
           // console.log(`startIndex from loadMorePrivateMessages()`, startIndex)
            // console.log(`endIndex from loadMorePrivateMessages()`, endIndex)
            // console.log(`loadingmore: start`, startIndex,`end`, endIndex)
            this.loadPaginatedPrivateMessages(currentUserId, privateConversationId, startIndex, endIndex)
              .pipe(
                rxjs.take(1),
                rxjs.map(messages => {
                  if (messages.length == 0) {
                    console.log(`no more messages left to load`)
                    this.canLoadMorePrivateMessages$.next(false)
                    console.log(`canLoadMore$`, this.canLoadMorePrivateMessages$.value)
                  }
                  return messages.map(message => {
                    return this.extractUserName(message.sentFromUserId).pipe(
                      rxjs.map(senderId => ({
                        isSeen: message.isSeen,
                        senderId: senderId,
                        message: message.body
                      }))
                    )
                  })
    
                }),
                rxjs.switchMap(asyncOperations => {
                  return rxjs.forkJoin(asyncOperations)
                }),
                rxjs.takeUntil(this.destroy$)
              ).subscribe(privateMesssages => {
                this.receivedPrivateMessages$.next([
                  ...privateMesssages,
                  ...this.receivedPrivateMessages$.value
                ])

                //needs looking into to make it function properly 
                 this.virtualScrollViewportPrivate$.next(3)
    
                this.maxScrollValue$.next(endIndex - 1)
                //    console.log('received private messages rxjs:', privateMesssages)
              })
          }
        }
      }

  extractUserName(sentFromUserId: any): rxjs.Observable<string> {
    return this.userService.getById(sentFromUserId).pipe(
      rxjs.take(1),
      rxjs.map(res => res.firstName)
    );
  }

  // scrollToBottom(): void {
  //   try {
  //     if (this.chatBodyContainer) {
  //       const chatBodyElement = this.chatBodyContainer.nativeElement;
  //       chatBodyElement.scrollTop = chatBodyElement.scrollHeight;
  //     }
  //   } catch (err) {
  //     console.log(`scroll error`, err)
  //   }
  // }

  public conversationIdSelectedClickHandler(conversationId: number): void {
    //make self unclickable in a public chat
    if (conversationId !== this.currentUserId$.getValue()) {
      //this was causing the improper loading
      this.initialPublicMessageStartIndex$.next(0)
      this.canLoadMorePrivateMessages$.next(false)
      //this was causing the improper loading

      this.chatService.getLatestNumberOfPrivateMessages(this.currentUserId$.getValue() as number, conversationId)
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


            return this.loadPaginatedPrivateMessages(
              this.currentUserId$.getValue() as number,
              conversationId,
              startIndex,
              endIndex
            ).pipe(rxjs.first());
          }),
          rxjs.takeUntil(this.destroy$)
        )
        .subscribe(res => {

          const privateMessages: any = res.map(async (message: any) => {
            const senderId = await this.extractUserName(message.sentFromUserId).toPromise()
            return {
              isSeen: message.isSeen,
              senderId: senderId,
              message: message.body
            }
          })

          Promise.all(privateMessages).then((messsages: any) => {
            this.receivedPrivateMessages$.next(messsages)

          })
        });

      //dissapearing `write to Client` logic is solved by filtering the private conversations by senderID not being equal to currently clicked conversationId
      if (this.chatService.senderId$.value !== conversationId) {
        this.chatService.isUserTyping$.next(false)
      }

      //changed this
      if (this.currentUserId$.value !== conversationId) {
        this.channelService.SelectedChannel$.next(undefined);
      }

      this.isDirectMessage.next(true)
      this.channelService.isPrivateChannel$.next(false)
      this.chatService.privateNotification[conversationId] = false;


      //seen logic 
      this.loadPrivateMessages(this.currentUserId$.getValue() as number, conversationId as number).pipe(
        rxjs.first(),
        rxjs.map(allMessages => allMessages.filter((message: { isSeen: boolean; }) => !message.isSeen)),
        rxjs.takeUntil(this.destroy$)
      ).subscribe(filteredUnSeenMessages => {
        //      console.log(`latest message sent:`, filteredUnSeenMessages
        filteredUnSeenMessages.forEach((unSeenMessage: any) => {
          this.chatService.notifyReceiverOfPrivateMessage(unSeenMessage)
        });
      }
      )

      //seen logic

      if (conversationId !== this.currentUserId$.getValue()) {
        this.privateConversationId$.next(conversationId);

      }

      //display the name of the user we want to write to
      this.chatService.onlineUsers$.pipe(
        rxjs.first(),
        rxjs.map(users => users.find(user => user.id === conversationId)),
        rxjs.takeUntil(this.destroy$)
      ).subscribe(user => {
        if (user) {
          this.channelService.selectedConversation$.next(user.id);
          this.userService.writingTo.next(`${user.firstName} ${user.lastName}`);
          this.userService.fullName = `write to ${user.firstName}:`
          //this.senderCurrentlyTyping = user.firstName;
        }
      })

    }
  }



}
