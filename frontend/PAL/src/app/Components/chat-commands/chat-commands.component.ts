import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChatService, PrivateMessage } from '../../Services/chat.service';
import { MessageService } from '../../Services/message.service';
import { UserService } from '../../Services/user.service';
import * as rxjs from 'rxjs';
import { AuthService } from '../../Services/auth.service';
import { ChannelService } from '../../Services/channel.service';

@Component({
  selector: 'app-chat-commands',
  templateUrl: './chat-commands.component.html',
  styleUrl: './chat-commands.component.css'
})
export class ChatCommandsComponent implements OnInit, OnDestroy {

  private destroy$ = new rxjs.Subject<void>();
  privateConversationId$ = this.chatService.privateConversationId$
  currentUserName$ = this.userService.currentUserName$

  newPublicMessage: string = '';
  newPrivateMessage: string = '';

  receivedPrivateMessages$ = this.messageService.receivedPrivateMessages$;
  receivedPublicMessages$ = this.messageService.receivedPublicMessages$

  currentUserId$ = this.authService.userId$;

  isUserTyping$ = this.chatService.isUserTyping$
  senderId$ = this.chatService.senderId$

  SelectedChannel$ = this.channelService.SelectedChannel$

  constructor(
    public chatService: ChatService,
    public messageService: MessageService,
    public userService: UserService,
    private authService: AuthService,
    private channelService: ChannelService
  ) { }
  ngOnInit(): void {

  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  public sendPrivateMessage(): void {

    this.currentUserName$.pipe(
      rxjs.first(),
     
      rxjs.switchMap(currentUserName => {
        if (this.newPrivateMessage !== undefined && this.privateConversationId$.getValue() !== undefined) {
          // Send private message
          return this.messageService.sendPrivateMessage(this.privateConversationId$.getValue(), this.newPrivateMessage as string).pipe(
            rxjs.tap(() => {
              // Create private message object
              const privateMessage: PrivateMessage = {
                senderId: currentUserName,
                message: this.newPrivateMessage,
                isSeen: false
              };

              // Shift oldest private message if needed
              if (this.messageService.receivedPrivateMessages$.value.length >= this.messageService.initialPrivateMessageStartIndex$.value) {
                this.messageService.receivedPrivateMessages$.value.shift();
              }

              // Update received private messages
              this.messageService.receivedPrivateMessages$.next([...this.receivedPrivateMessages$.value, privateMessage]);

              // Update the number of private messages
              this.chatService.getLatestNumberOfPrivateMessages(
                this.currentUserId$.getValue() as number,
                this.privateConversationId$.getValue() as number
              );

              // Clear the new private message
              this.newPrivateMessage = '';
            })
          );
        } else {
          return rxjs.EMPTY;
        }
      }),
      rxjs.switchMap(() => this.messageService.maxScrollValue$),
      rxjs.take(1)
    ).subscribe(maxScrollValue => {
      // Scroll logic
      this.messageService.endScrollValue$.next(maxScrollValue);
    });
  }

  sendMessage(): void {

    //scroll logic
    this.messageService.maxScrollValue$.pipe(rxjs.take(1)).subscribe(maxScrollValue => {
      //console.log(`maxScrollValue from sendMessage()`,maxScrollValue)
      this.messageService.endScrollValue$.next(maxScrollValue)
    })

    const selectedChannel = this.SelectedChannel$.getValue();

    if (this.currentUserId$.getValue() && this.newPublicMessage && selectedChannel) {

      this.messageService.sendMessage(this.currentUserId$.getValue() as number, this.newPublicMessage, selectedChannel);

      const newPubMessage = this.newPublicMessage;
      this.messageService.extractUserName(this.currentUserId$.getValue()).subscribe(firstName => {

        //        console.log(firstName)
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
}
