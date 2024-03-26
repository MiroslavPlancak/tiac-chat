import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChatService, PrivateMessage } from '../../Services/chat.service';
import { AuthService } from '../../Services/auth.service';
import { UserService } from '../../Services/user.service';
import * as rxjs from 'rxjs';
import { MessageService } from '../../Services/message.service';
import { ChannelService } from '../../Services/channel.service';
import { HubConnectionState } from '@microsoft/signalr';





@Component({
  selector: 'app-chat',
  templateUrl: './chat-mat.component.html',
  styleUrl: './chat-mat.component.css'
})
export class ChatMatComponent implements OnInit, OnDestroy {

  private destroy$ = new rxjs.Subject<void>();

  receivedPrivateMessages$ = this.messageService.receivedPrivateMessages$;
  receivedPublicMessages$ = this.messageService.receivedPublicMessages$

  isUserTyping$ = this.chatService.isUserTyping$
  senderId$ = this.chatService.senderId$


  privateConversationId$ = this.chatService.privateConversationId$ // <= 
  
  

  newPublicMessage: string = '';
  newPrivateMessage: string = '';


  SelectedChannel$ = this.channelService.SelectedChannel$           // <=

  //channel properties
  channelTypes: { [key: string]: number } = {
    private: 0,
    public: 1
  };

  channelType!: number;
  writingTo = this.userService.writingTo 
                                 

  currentUserId$ = this.authService.userId$;   
 
 
  maxScrollValue$ = this.messageService.maxScrollValue$

  currentUserName$ = this.userService.currentUserName$
 

  constructor(
    public chatService: ChatService,
    private authService: AuthService,
    public userService: UserService,
    public  messageService: MessageService,
    private channelService: ChannelService,
   //private connectionService:ConnectionService

  ) {
    this.channelType = this.channelTypes['public'];
    console.log(this.chatService.hubConnection.state)
  }


  ngOnInit(): void {
   
    this.maxScrollValue$.subscribe(res => {console.log(`x`,res)})

    if (this.chatService.hubConnection.state === HubConnectionState.Disconnected) {
      console.log(`this block runs`)
      this.chatService.hubConnection.start();
    }

    console.log(this.chatService.hubConnection.state)
    //testing http endpoint 
 
  }

  ngOnDestroy(): void {
    this.destroy$.next(); 
    this.destroy$.complete();
  }


}
