import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ChatService, PrivateMessage } from '../../Services/chat.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AuthService } from '../../Services/auth.service';
import { User, UserService } from '../../Services/user.service';
import * as rxjs from 'rxjs';
import { MessageService } from '../../Services/message.service';
import { ChannelService } from '../../Services/channel.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CreateChannelComponent } from '../create-channel/create-channel.component';
import { AddUserToPrivateChannelComponent } from '../add-user-to-private-channel/add-user-to-private-channel.component';
import { HubConnectionState } from '@microsoft/signalr';
import { NotificationDialogService } from '../../Services/notification-dialog.service';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';



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
  maxScrollValue$ = new rxjs.BehaviorSubject<number>(0);

  currentUserName$ = this.userService.currentUserName$
  currentUserLogged$ = this.userService.currentUserLogged$

  constructor(
    public chatService: ChatService,
    private jwtHelper: JwtHelperService,
    private authService: AuthService,
    public userService: UserService,
    public  messageService: MessageService,
    private channelService: ChannelService,
    private matDialog: MatDialog,
    private notificationDialog: NotificationDialogService,

  ) {
    this.channelType = this.channelTypes['public'];
    console.log(this.chatService.hubConnection.state)

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
  ngOnInit(): void {

  

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

    this.privateConversationUsers$ = rxjs.combineLatest([this.privateConversationId$, this.authService.userId$, this.chatService.allUsers$]).pipe(
      rxjs.filter(([privateConversationId, userId]) => {
        return privateConversationId != undefined && userId != undefined
      }),
      rxjs.map(([privateConversationId, userId, allUsers]) => {
        return allUsers.filter(user => [privateConversationId, userId].includes(user.id))
      })
    )

    this.privateConversationUsers$.pipe(rxjs.takeUntil(this.destroy$)).subscribe(res => {

    })




    //receive private messages ###problem with the multicasting of private messages is here
    this.chatService.receivePrivateMesages()
      .pipe(
        rxjs.withLatestFrom(this.privateConversationUsers$),
        rxjs.takeUntil(this.destroy$)
      )
      .subscribe(([loadedPrivateMessages, users]) => {
        const sender = users.find(user => user.id === +loadedPrivateMessages.senderId)


        if (sender !== undefined) {
          const newPrivateMessage: PrivateMessage = {
            //this bit needs updating
            isSeen: loadedPrivateMessages.isSeen,
            message: loadedPrivateMessages.message,
            senderId: sender?.firstName ?? '1'
          }

          //pop the first private message out of the BS[]
          if (this.messageService.receivedPrivateMessages$.value.length >= this.messageService.initialPrivateMessageStartIndex$.value) {
            this.messageService.receivedPrivateMessages$.value.shift()
          }
          //push the next one in
          this.messageService.receivedPrivateMessages$.next([...this.receivedPrivateMessages$.value, newPrivateMessage])
        
        }
        setTimeout(() => {
          this.scrollToBottom()
        })

      })

   

  }

  ngOnDestroy(): void {
    this.destroy$.next(); 
    this.destroy$.complete();
  }

  //token logic
//unsure if this can be removed
  // getAccessToken(): string | null {
  //   return localStorage.getItem('access_token');
  // }

  // extractUserId(): number | null {

  //   const accessToken = this.accessToken;
  //   if (accessToken) {
  //     const decodedToken = this.jwtHelper.decodeToken(accessToken);
  //     return decodedToken ? +decodedToken.userId : null;
  //   }
  //   return null;
  // }

  sendMessage(): void {

    this.maxScrollValue$.pipe(

      rxjs.switchMap(maxScrollValue => {
        return rxjs.of(maxScrollValue)
      }),

    ).subscribe((latestScrollValue) => {

      setTimeout(() => {
        this.scrollToEnd(latestScrollValue);
      }, 10);
    })

    const selectedChannel = this.SelectedChannel$.getValue();

    if (this.currentUserId$.getValue() && this.newPublicMessage && selectedChannel) {

      this.chatService.sendMessage(this.currentUserId$.getValue() as number, this.newPublicMessage, selectedChannel);

      const newPubMessage = this.newPublicMessage;
      this.extractUserName(this.currentUserId$.getValue()).subscribe(firstName => {

        console.log(firstName)
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

  //scroll logic
    this.maxScrollValue$.pipe(

      rxjs.switchMap(maxScrollValue => {
        return rxjs.of(maxScrollValue)
      }),

    ).subscribe((latestScrollValue) => {

      setTimeout(() => {
        this.scrollToEnd(latestScrollValue);
      }, 10);
    })

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
       // this.receivedPrivateMessages.push(privateMessage);

        //update the number of private messages
        this.chatService.getLatestNumberOfPrivateMessages(this.currentUserId$.getValue() as number, this.privateConversationId$.getValue() as number)

        this.newPrivateMessage = '';
        setTimeout(() => {
          this.scrollToBottom()
        })
      }
    })



  }

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


            return this.messageService.loadPaginatedPrivateMessages(
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
      if (this.senderId$.value !== conversationId) {
        this.isUserTyping$.next(false)
      }

      //changed this
      if (this.currentUserId$.value !== conversationId) {
        this.SelectedChannel$.next(undefined);
      }

      this.isDirectMessage.next(true)
      this.isPrivateChannel.next(false)
      this.privateNotification[conversationId] = false;

      //seen logic 
      this.messageService.loadPrivateMessages(this.currentUserId$.getValue() as number, conversationId as number).pipe(
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
          this.selectedConversation.next(user.id);
          this.writingTo.next(`${user.firstName} ${user.lastName}`);
          this.fullName = `write to ${user.firstName}:`
          //this.senderCurrentlyTyping = user.firstName;
        }
      })

    }
  }



  scrollToBottom(): void {
    try {
      if (this.chatBodyContainer) {
        const chatBodyElement = this.chatBodyContainer.nativeElement;
        chatBodyElement.scrollTop = chatBodyElement.scrollHeight;
      }
    } catch (err) {
      console.log(`scroll error`, err)
    }
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

  extractUserName(sentFromUserId: any): rxjs.Observable<string> {
    return this.userService.getById(sentFromUserId).pipe(
      rxjs.take(1),
      rxjs.map(res => res.firstName)
    );

  }

  loadMorePrivateMessages(): void {
//    console.log('loading more private messages...')
    const [currentUserId, privateConversationId] = [this.currentUserId$.getValue(), this.privateConversationId$.getValue()]
    if (currentUserId !== null && privateConversationId !== undefined) {

      if (this.messageService.canLoadMorePrivateMessages$.value !== false && privateConversationId !== undefined) {
        let startIndex = this.messageService.initialPrivateMessageStartIndex$.value
        let endIndex = startIndex + 10
        this.messageService.initialPrivateMessageStartIndex$.next(endIndex)
        console.log(`startIndex from loadMorePrivateMessages()`, startIndex)
        console.log(`endIndex from loadMorePrivateMessages()`, endIndex)
        // console.log(`loadingmore: start`, startIndex,`end`, endIndex)
        this.messageService.loadPaginatedPrivateMessages(currentUserId, privateConversationId, startIndex, endIndex)
          .pipe(
            rxjs.take(1),
            rxjs.map(messages => {
              if (messages.length == 0) {
                console.log(`no more messages left to load`)
                this.messageService.canLoadMorePrivateMessages$.next(false)
                console.log(`canLoadMore$`, this.messageService.canLoadMorePrivateMessages$.value)
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
            this.virtualScrollViewport.scrollToIndex(2)

            this.maxScrollValue$.next(endIndex - 1)
            //    console.log('received private messages rxjs:', privateMesssages)
          })
      }
    }
  }

  scrollToEnd(index: number): void {

    this.virtualScrollViewport.scrollToIndex(index)
  }

  privateAutoScroll(event: any): void {

    if (event == 0) {
      this.loadMorePrivateMessages()

    }
  }

  publicAutoScroll(event: any): void {
    //console.log(`scroll value:`,event)
    if (event == 0) {
      this.loadMorePublicMessages()

    }
  }

  loadMorePublicMessages() {
    console.log(`loading more public messages...`)

    const selectedChannelId = this.SelectedChannel$.value
    console.log(`after`, this.messageService.canLoadMorePublicMessages$.value)
    if (this.messageService.canLoadMorePublicMessages$.value !== false && selectedChannelId !== undefined) {

      let startIndex = this.messageService.initialPublicMessageStartIndex$.value
      let endIndex = startIndex + 10
      this.messageService.initialPublicMessageStartIndex$.next(endIndex)
      console.log(`startIndex from public`, startIndex)
      console.log(`endIndex from public`, endIndex)
      this.messageService.loadPaginatedPublicMessagesById(selectedChannelId as number, startIndex, endIndex)
        .pipe(
          rxjs.take(1),
          rxjs.map(messages => {

            if (messages.length == 0) {
              console.log(`no more messages left to load..`)
              this.messageService.canLoadMorePublicMessages$.next(false)
              console.log(`canLoadMorePublicMessages$`, this.messageService.canLoadMorePublicMessages$.value)
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

          this.virtualScrollViewportPublic.scrollToIndex(2)
          this.maxScrollValue$.next(endIndex - 1)
        })
    }
  }
}
