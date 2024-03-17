import { Component, OnDestroy, OnInit } from '@angular/core';
import * as rxjs from 'rxjs';
import { ChatService } from '../../Services/chat.service';
import { User, UserService } from '../../Services/user.service';
import { AuthService } from '../../Services/auth.service';
import { MessageService } from '../../Services/message.service';
import { ChannelService } from '../../Services/channel.service';

@Component({
  selector: 'app-online-users',
  templateUrl: './online-users.component.html',
  styleUrl: './online-users.component.css'
})
export class OnlineUsersComponent implements OnInit, OnDestroy {

  private destroy$ = new rxjs.Subject<void>();
  onlineUserSearchTerm$ = new rxjs.BehaviorSubject<string | undefined>(undefined);
  onlineFilteredUsers$!: rxjs.Observable<User[]>;
  currentUserId$ = this.authService.userId$;
  selectedConversation = this.channelService.selectedConversation$
  isDirectMessage = this.messageService.isDirectMessage
  privateConversationId$ = this.chatService.privateConversationId$;
  privateNotification = this.chatService.privateNotification;
  conversationId: number = 0
  initialPublicMessageStartIndex$ = this.messageService.initialPublicMessageStartIndex$
  canLoadMorePrivateMessages$ = this.messageService.canLoadMorePrivateMessages$



  constructor
    (
      private chatService: ChatService,
      private authService: AuthService,
      private messageService: MessageService,
      private userService: UserService,
      private channelService: ChannelService
    ) { }


  ngOnInit(): void {

    //filtering logic for online users
    this.onlineFilteredUsers$ = rxjs.combineLatest([
      this.chatService.onlineUsers$,
      this.onlineUserSearchTerm$
    ]).pipe(
      rxjs.map(([onlineUsers, term]) => {
        if (term == undefined) {
          return onlineUsers;
        } else {
          return onlineUsers.filter(user => JSON.stringify([user.firstName, user.lastName]).toLowerCase().indexOf(term) > -1)
        }
      }),
      rxjs.takeUntil(this.destroy$)
    )

    //subscribe to the event of receiving a private message
    this.chatService.privateMessageReceived()
      .pipe(rxjs.takeUntil(this.destroy$))
      .subscribe(res => {
        console.log(`seen`, res)
        this.messageService.receivedPrivateMessages$.pipe(rxjs.take(1))
          .subscribe(messages => {
            messages.forEach(message => message.isSeen = true)
          })
      });

    //this is where we update "seen" logic instantly if the proper conversation is selected.
    this.chatService.receivePrivateMesages().pipe(rxjs.takeUntil(this.destroy$)).subscribe(privateMessage => {

      // Handle the received private message (e.g., update UI)
      if (this.privateConversationId$.value) {
        this.messageService.loadPrivateMessages(this.currentUserId$.getValue() as number, this.privateConversationId$.value as number).pipe(
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
      if (+privateMessage.senderId as number !== this.privateConversationId$.value) {
        this.privateNotification[+privateMessage.senderId] = true;
      }

    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  filterOnlineUsers($event: any) {
    const value = $event.target.value;
    this.onlineUserSearchTerm$.next(value === '' ? undefined : value)  
  }

  public conversationIdSelectedClickHandler(conversationId: number): void {

    this.conversationId = conversationId;

    //make self unclickable in a public chat
    if (conversationId !== this.currentUserId$.getValue()) {

      //this was causing the improper loading
      this.initialPublicMessageStartIndex$.next(0)
      this.canLoadMorePrivateMessages$.next(false)

      this.getConcurrentNumberOfMessages()

      //dissapearing `write to Client` logic is solved by filtering the private conversations by senderID not being equal to currently clicked conversationId
      if (this.chatService.senderId$.value !== conversationId) {
        this.chatService.isUserTyping$.next(false)
      }

      //changed this
      if (this.currentUserId$.value !== conversationId) {
        this.channelService.SelectedChannel$.next(undefined);
      }

      this.isDirectMessage.next(true);
      this.channelService.isPrivateChannel$.next(false);
      this.chatService.privateNotification[conversationId] = false;

      //seen logic

      this.seenMessageStatus()


      if (conversationId !== this.currentUserId$.getValue()) {
        this.privateConversationId$.next(conversationId);
      }

      //display the name of the user we want to write to
      this.displayUserNameToWriteTo()

    }
  }

  extractUserName(sentFromUserId: any): rxjs.Observable<string> {
    return this.userService.getById(sentFromUserId).pipe(
      rxjs.take(1),
      rxjs.map(res => res.firstName)
    );

  }

  displayUserNameToWriteTo(): void {

    this.chatService.onlineUsers$.pipe(
      rxjs.first(),
      rxjs.map(users => users.find(user => user.id === this.conversationId)),
      rxjs.takeUntil(this.destroy$)
    ).subscribe(user => {
      if (user) {
        this.selectedConversation.next(user.id)
        this.userService.writingTo.next(`${user.firstName} ${user.lastName}`);
        this.userService.fullName = `write to ${user.firstName}:`
      }
    })
  }

  seenMessageStatus(): void {
   
    this.messageService.loadPrivateMessages(this.currentUserId$.getValue() as number, this.conversationId as number).pipe(
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

  getConcurrentNumberOfMessages(): void {

    this.chatService.getLatestNumberOfPrivateMessages(this.currentUserId$.getValue() as number, this.conversationId)
    this.chatService.receiveLatestNumberOfPrivateMessages()
      .pipe(
        rxjs.first(),
        rxjs.switchMap(totalMessagesNumber => {
          this.messageService.totalPrivateConversationMessagesNumber$.next(totalMessagesNumber);

          //displays the button if there are messages to be loaded/disappears it when there arent.
          this.messageService.canLoadMorePrivateMessages$.next(totalMessagesNumber > 10);

          const startIndex = 0
          const endIndex = totalMessagesNumber - (totalMessagesNumber - 10);
          this.messageService.initialPrivateMessageStartIndex$.next(endIndex)

          return this.messageService.loadPaginatedPrivateMessages(
            this.currentUserId$.getValue() as number,
            this.conversationId,
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

          this.messageService.receivedPrivateMessages$.next(messsages)
          //console.log(this.messageService.receivedPrivateMessages$.value)
        })
      });
  }
}
