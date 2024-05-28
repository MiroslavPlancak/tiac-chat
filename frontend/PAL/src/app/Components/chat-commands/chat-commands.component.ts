import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChatService, PrivateMessage } from '../../Services/chat.service';
import { MessageService } from '../../Services/message.service';
import { UserService } from '../../Services/user.service';
import * as rxjs from 'rxjs';
import { AuthService } from '../../Services/auth.service';
import { ChannelService } from '../../Services/channel.service';
import { Store } from '@ngrx/store';
import { Users } from '../../state/user/user.action'
import { Messages } from '../../state/message/message.action'
import { selectCurrentUser } from '../../state/user/user.selector';
import { selectCurrentlyClickedConversation } from '../../state/channel/channel.selector';

@Component({
  selector: 'app-chat-commands',
  templateUrl: './chat-commands.component.html',
  styleUrl: './chat-commands.component.css'
})
export class ChatCommandsComponent implements OnInit, OnDestroy {

  private destroy$ = new rxjs.Subject<void>();
  privateConversationId$ = this.chatService.privateConversationId$
  //ng rx
  currentUserName$ = this.store.select(selectCurrentUser)

  newPublicMessage: string = '';
  newPrivateMessage: string = '';

  //receivedPrivateMessages$ = this.messageService.receivedPrivateMessages$;
 // receivedPublicMessages$ = this.messageService.receivedPublicMessages$

  currentUserId$ = this.authService.userId$;

  isUserTyping$ = this.chatService.isUserTyping$
  senderId$ = this.chatService.senderId$

  //SelectedChannel$ = this.channelService.SelectedChannel$

  constructor(
    public chatService: ChatService,
    public messageService: MessageService,
    public userService: UserService,
    private authService: AuthService,
    private store: Store
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

          this.store.dispatch(Messages.Hub.Actions.sendPrivateMessageStarted({
            privateMessage: {
              id: 0,
              body: this.newPrivateMessage,
              sentFromUserId: Number(this.currentUserId$.getValue()),
              sentToUser: this.privateConversationId$.getValue(),
              sentToChannel: 0,
              time: new Date,
              isSeen: false
            },
            receiverId: Number(this.privateConversationId$.getValue())
          }))
          // Update the number of private messages
          this.chatService.getLatestNumberOfPrivateMessages(
            this.currentUserId$.getValue() as number,
            this.privateConversationId$.getValue() as number
          );

          // Clear the new private message
          this.newPrivateMessage = '';
          return rxjs.of(currentUserName)
          // Send private message
          // return this.messageService.sendPrivateMessage(this.privateConversationId$.getValue(), this.newPrivateMessage as string).pipe(
          //   rxjs.tap(() => {
          //     // Create private message object
          //     const privateMessage: PrivateMessage = {
          //       senderId: currentUserName.firstName,
          //       message: this.newPrivateMessage,
          //       isSeen: false
          //     };
          //     //ng rx test


          //     // Shift oldest private message if needed
          //     // if (this.messageService.receivedPrivateMessages$.value.length >= this.messageService.initialPrivateMessageStartIndex$.value) {
          //     //   this.messageService.receivedPrivateMessages$.value.shift();
          //     // }

          //     // // Update received private messages
          //     // this.messageService.receivedPrivateMessages$.next([...this.receivedPrivateMessages$.value, privateMessage]);


          //   })
          // );

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
      this.messageService.endScrollValue$.next(maxScrollValue)
    })


    const selectedChannelNgRx$ = this.store.select(selectCurrentlyClickedConversation)
    selectedChannelNgRx$.subscribe((selectedConversation) => {
      if (this.currentUserId$.getValue() && this.newPublicMessage && selectedConversation) {

        //ngRx new implementation
        const publicMessage ={
          id: 0,
          body: this.newPublicMessage,
          sentFromUserId: Number(this.currentUserId$.getValue()),
          sentToUser: 0,
          sentToChannel:selectedConversation,
          time: new Date,
          isSeen:false
        }
        // console.log(`SendMessage/userId:`, Number(this.currentUserId$.getValue()))
        // console.log(`SendMessage/message:`, publicMessage)
        // console.log(`SendMessage/selectedConversation`, selectedConversation)

        this.store.dispatch(Messages.Hub.Actions.sendPublicMessageStarted({ 
          senderId: Number(this.currentUserId$.getValue()),
          publicMessage: publicMessage,
          channelId: selectedConversation
         }))

       // this.messageService.sendMessage(this.currentUserId$.getValue() as number, publicMessage, selectedConversation);

        // const newPubMessage = this.newPublicMessage;
        // this.messageService.extractUserName(this.currentUserId$.getValue()).subscribe(firstName => {

        //   //        console.log(firstName)
        //   const publicMessage: any = {
        //     sentFromUserDTO: {
        //       firstName: firstName,
        //     },
        //     body: newPubMessage
        //   }

        //   //need to edit 10 here to be dynamic
        //   if (this.messageService.receivedPublicMessages$.value.length >= this.messageService.initialPublicMessageStartIndex$.value) {
        //     this.messageService.receivedPublicMessages$.value.shift()
        //   }

        //   this.messageService.receivedPublicMessages$.next([...this.receivedPublicMessages$.value, publicMessage])
        //   this.chatService.getLatestNumberOfPublicChannelMessages(selectedConversation, this.currentUserId$.getValue() as number)
        // })
        //clear the input for the next message
        this.newPublicMessage = '';
      }
    })
  }
    // Handle the Enter key press to send the message and prevent newline
    handleKeyDown(event: KeyboardEvent, isPrivate: boolean): void {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Prevent default behavior (new line)
        if (isPrivate) {
          this.sendPrivateMessage(); // Send private message
        } else {
          this.sendMessage(); // Send public message
        }
      }
    }
  
  
}
