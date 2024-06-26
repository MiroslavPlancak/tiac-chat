import { Component, OnDestroy, OnInit } from '@angular/core';
import * as rxjs from 'rxjs';
import { User, UserService } from '../../Services/user.service';
import { ChatService } from '../../Services/chat.service';
import { AuthService } from '../../Services/auth.service';
import { MessageService } from '../../Services/message.service';
import { ChannelService } from '../../Services/channel.service';

@Component({
  selector: 'app-offline-users',
  templateUrl: './offline-users.component.html',
  styleUrl: './offline-users.component.css'
})
export class OfflineUsersComponent implements OnInit, OnDestroy {

  private destroy$ = new rxjs.Subject<void>();
  offlineUserSearchTerm$ = new rxjs.BehaviorSubject<string | undefined>(undefined)
  offlineFilteredUsers$!: rxjs.Observable<User[]>;
  currentUserId$ = this.authService.userId$;
  currentUserName = new rxjs.BehaviorSubject<string>('')
  isDirectMessage = this.messageService.isDirectMessage
  isDirectMessageOffline = this.messageService.isDirectMessageOffline
  selectedConversation = this.channelService.selectedConversation$
  privateConversationId$ = this.chatService.privateConversationId$;
  conversationId: number = 0

  constructor
    (
      private chatService: ChatService,
      private userService: UserService,
      private authService: AuthService,
      private messageService: MessageService,
      private channelService: ChannelService
    ) { }


  ngOnInit(): void {

    this.offlineFilteredUsers$ = rxjs.combineLatest([
      this.userService.offlineUsers$,
      this.offlineUserSearchTerm$
    ])
      .pipe(
        rxjs.map(([offlineUsers, term]) => {
          if (term == undefined) {
            return offlineUsers.filter(offlineUser => offlineUser.id !== this.currentUserId$.getValue());
          } else {
            return offlineUsers.filter(user => JSON.stringify([user.firstName, user.lastName]).toLowerCase().indexOf(term) > -1)
          }
        }),
        rxjs.takeUntil(this.destroy$)
      )

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  filterOfflineUsers($event: any) {
    const value = $event.target.value;
    this.offlineUserSearchTerm$.next(value === '' ? undefined : value)
  }

  conversationIdSelectedOfflineClickHandler(conversationId: number): void {
    this.conversationId = conversationId;

    if (conversationId !== this.currentUserId$.getValue()) {

      this.messageService.initialPublicMessageStartIndex$.next(0)
      this.messageService.canLoadMorePrivateMessages$.next(false)

      this.getConcurrentNumberOfMessages()

      this.channelService.SelectedChannel$.next(undefined);
      this.isDirectMessage.next(false);
      this.isDirectMessageOffline.next(true);

      this.channelService.isPrivateChannel$.next(false);
      this.chatService.privateConversationId$.next(conversationId)

      this.displayOfflineUserNameToWriteTo()
    }
  }

  extractUserName(sentFromUserId: any): rxjs.Observable<string> {
    return this.userService.getById(sentFromUserId).pipe(
      rxjs.take(1),
      rxjs.map(res => res.firstName)
    );
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
        })
      });
  }

  displayOfflineUserNameToWriteTo(): void {
    this.userService.offlineUsers$.pipe(
      rxjs.first()
    ).subscribe(offlineUsers => {
      const offlineUser = offlineUsers.find(user => user.id === this.conversationId);
      if (offlineUser) {
        this.selectedConversation.next(offlineUser.id);
        this.userService.writingTo.next(`${offlineUser.firstName} ${offlineUser.lastName}`)
        this.userService.fullName = `write to ${offlineUser.firstName}`;
      } else {
        console.error('error occured selecting offline user.');
      }
    }
    )
  }
}
