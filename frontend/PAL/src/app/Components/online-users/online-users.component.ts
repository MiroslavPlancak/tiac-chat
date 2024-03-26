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
      public messageService: MessageService,
      private userService: UserService,
      private channelService: ChannelService
    ) { }


  ngOnInit(): void {

    //filtering logic for online users
    this.onlineFilteredUsers$ = rxjs.combineLatest([
      this.userService.onlineUsers$,
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
        //console.log(`seen`, res)
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

  // public conversationIdSelectedClickHandler(conversationId: number): void {

  //   //this if statements ensure that when a client sends a private message to first user and then switches the conversation
  //   //to second user and starts typing to that second user, the `client is typing...` for the first user is cleared properly
  //   const currentlyTypingFilteredConvoId = this.chatService.currentlyTypingUsers$.value.filter(correctUser => correctUser !== conversationId)
  //   if (+currentlyTypingFilteredConvoId !== conversationId) {

  //     this.chatService.sendTypingStatus(false, this.currentUserId$.getValue() as number, +currentlyTypingFilteredConvoId)
  //   }

  //   if (this.chatService.currentlyTypingUsers$.value.length == 0) {

  //     this.chatService.sendTypingStatus(false, this.currentUserId$.getValue() as number, this.selectedConversation.getValue());
  //   }
  //   ///////////////////

  //   this.conversationId = conversationId;

  //   //make self unclickable in a public chat
  //   if (conversationId !== this.currentUserId$.getValue()) {

  //     //this was causing the improper loading
  //     this.initialPublicMessageStartIndex$.next(0)
  //     this.canLoadMorePrivateMessages$.next(false)

  //     this.messageService.getConcurrentNumberOfMessages()

  //     //dissapearing `write to Client` logic is solved by filtering the private conversations by senderID not being equal to currently clicked conversationId
  //     if (this.chatService.senderId$.value !== conversationId) {
  //       this.chatService.isUserTyping$.next(false)
  //     }

  //     //changed this
  //     if (this.currentUserId$.value !== conversationId) {
  //       this.channelService.SelectedChannel$.next(undefined);
  //     }

  //     this.isDirectMessage.next(true);
  //     this.channelService.isPrivateChannel$.next(false);
  //     this.chatService.privateNotification[conversationId] = false;

  //     //seen logic

  //     this.messageService.seenMessageStatus()


  //     if (conversationId !== this.currentUserId$.getValue()) {
  //       this.privateConversationId$.next(conversationId);
  //     }

  //     //display the name of the user we want to write to
  //     this.messageService.displayUserNameToWriteTo()

  //   }
  // }





}
