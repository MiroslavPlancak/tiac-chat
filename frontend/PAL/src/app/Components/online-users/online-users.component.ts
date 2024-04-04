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
    // this.chatService.privateMessageReceived()
    //   .pipe(rxjs.takeUntil(this.destroy$))
    //   .subscribe(res => {
    //     //console.log(`seen`, res)
    //     this.messageService.receivedPrivateMessages$.pipe(rxjs.take(1))
    //       .subscribe(messages => {
    //         messages.forEach(message => message.isSeen = true)
    //       })
    //   });

    //subscribe to the event of receiving a private message using switchMap()
    this.chatService.privateMessageReceived().pipe(
      rxjs.takeUntil(this.destroy$),
      rxjs.switchMap(() => {
        return this.messageService.receivedPrivateMessages$.pipe(
          rxjs.take(1),
          rxjs.tap(messages => {
            messages.forEach(message => message.isSeen = true);
          })
        );
      })
    ).subscribe();

    //this is where we update "seen" logic instantly if the proper conversation is selected.
    // this.messageService.receivePrivateMesages().pipe(rxjs.takeUntil(this.destroy$)).subscribe(privateMessage => {

    //   // Handle the received private message (e.g., update UI)
    //   if (this.privateConversationId$.value) {
    //     this.messageService.loadPrivateMessages(this.currentUserId$.getValue() as number, this.privateConversationId$.value as number).pipe(
    //       rxjs.first(),
    //       rxjs.map(allMessages => allMessages.filter((message: { isSeen: boolean; }) => !message.isSeen)),
    //       rxjs.takeUntil(this.destroy$)
    //     ).subscribe(filteredUnSeenMessages => {
    //       filteredUnSeenMessages.forEach((unSeenMessage: any) => {
    //         this.chatService.notifyReceiverOfPrivateMessage(unSeenMessage)
    //       });
    //     }
    //     )
    //   }
    //   if (+privateMessage.senderId as number !== this.privateConversationId$.value) {
    //     console.log(privateMessage)
    //     console.log(+privateMessage.senderId as number)
    //     console.log(this.privateConversationId$.value)
    //     this.privateNotification[+privateMessage.senderId] = true;
    //   }

    // });

    this.messageService.receivePrivateMesages().pipe(
      rxjs.takeUntil(this.destroy$),
      rxjs.switchMap(privateMessage => {
        if (this.privateConversationId$.value) {
          // the problem is here: namely when different convo is selected privateconversationId$ is different and this loads the correct messages

          return this.messageService.loadPrivateMessages(this.currentUserId$.getValue() as number, this.privateConversationId$.value as number).pipe(
            rxjs.first(),
            rxjs.map(allMessages => allMessages.filter((message: { isSeen: boolean; }) => !message.isSeen)),
            rxjs.tap(filteredUnSeenMessages => {
              console.log(`privateconversationId$.value`, this.privateConversationId$.value)
              filteredUnSeenMessages.forEach((unSeenMessage: any) => {
                this.chatService.notifyReceiverOfPrivateMessage(unSeenMessage);
              });
            }),
            rxjs.switchMap(() => rxjs.of(privateMessage))
          );
        } else {
          return rxjs.of(privateMessage); // or another observable if necessary
        }
      }),
      rxjs.tap(privateMessage => {
        console.log(privateMessage)
        if (+privateMessage.senderId as number !== this.privateConversationId$.value) {
          console.log(+privateMessage.senderId as number)
          console.log(this.privateConversationId$.value)
          this.privateNotification[+privateMessage.senderId] = true;
        }
      })
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  filterOnlineUsers($event: any) {
    const value = $event.target.value;
    this.onlineUserSearchTerm$.next(value === '' ? undefined : value)
  }

  



}
