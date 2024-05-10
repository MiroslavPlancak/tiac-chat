import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChatService } from '../../Services/chat.service';
import { UserService } from '../../Services/user.service';
import * as rxjs from 'rxjs';
import { MessageService } from '../../Services/message.service';
import { HubConnectionState } from '@microsoft/signalr';
import { ConnectionService } from '../../Services/connection.service';
import { AuthService } from '../../Services/auth.service';


@Component({
  selector: 'app-chat',
  templateUrl: './chat-mat.component.html',
  styleUrl: './chat-mat.component.css'
})
export class ChatMatComponent implements OnInit, OnDestroy {

  private destroy$ = new rxjs.Subject<void>();

  //channel properties
  channelTypes: { [key: string]: number } = {
    private: 0,
    public: 1
  };

  channelType!: number;
  writingTo = this.userService.writingTo

  maxScrollValue$ = this.messageService.maxScrollValue$

  constructor(
    public chatService: ChatService,
    public userService: UserService,
    public messageService: MessageService,
    public connectionService: ConnectionService,
    public authService: AuthService
  ) {
    this.channelType = this.channelTypes['public'];
//    console.log(this.chatService.hubConnection.state)
  }


  ngOnInit(): void {

    this.maxScrollValue$.subscribe(res => { /*console.log(`x`, res)*/ })
    //console.log(`connection state`,this.connectionService.hubConnection.state)
    if (this.chatService.hubConnection.state === HubConnectionState.Disconnected
    ) {
      this.connectionService.setupTokenRefreshTimer()
      console.log(`this block runs`)
      this.chatService.hubConnection.start();
    }

   // console.log(this.chatService.hubConnection.state)

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if(this.authService.tokenRefreshTimer$){
      clearInterval(this.authService.tokenRefreshTimer$.getValue())
    }
  }


}
