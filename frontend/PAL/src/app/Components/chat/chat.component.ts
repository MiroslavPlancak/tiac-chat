import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChatService, PrivateMessage } from '../../Services/chat.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AuthService } from '../../Services/auth.service';
import { User, UserService } from '../../Services/user.service';
import { BehaviorSubject, Observable,combineLatest,  filter, forkJoin, map, mergeMap, switchMap, withLatestFrom } from 'rxjs';
import { MessageService } from '../../Services/message.service';
import { ChannelService } from '../../Services/channel.service';
import { Store } from '@ngrx/store';
import { Users } from '../../state/user/user.action'
import { selectUserById } from '../../state/user/user.selector';
import * as rxjs from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy {

  privateConversationId$ = new BehaviorSubject<number | undefined>(undefined)
  privateConversationUsers$!: Observable<User[]>;
  privateConversationMessages$!: Observable<PrivateMessage[]>
  


  currentUserId = -1;

  
 
  receivedPublicMessages: any[] = [];
  receivedPrivateMessages: PrivateMessage[] = [];
  accessToken = this.getAccessToken();

  loadedPublicChannels: any[] = [];
  SelectedChannel$ = new BehaviorSubject<number | undefined>(8);

  //channel properties
  channelTypes: { [key: string]: number } = {
    private: 0,
    public: 1
  };

  channelName!: string;
  channelType!: number;



  constructor(
    public chatService: ChatService,
    private jwtHelper: JwtHelperService,
    private authService: AuthService,
    public userService: UserService,
    private messageService: MessageService,
    private channelService: ChannelService,
    private store: Store
  ) {
    this.channelType = this.channelTypes['public'];
  }

  ngOnInit(): void {


    // receive public messages
    this.messageService.receiveMessage().subscribe((message: any) => {

      this.receivedPublicMessages.push(message);
      //console.log(message);
    })

   
    this.SelectedChannel$.pipe(
      filter(selectedChannel => selectedChannel !== undefined),
      switchMap(selectedChannel => {

        
        return this.messageService.loadMessagesByChannelId(selectedChannel as number);

      })
    ).subscribe((loadedPublicMesages) => {
      this.receivedPublicMessages = [];
      console.log(`loaded public messages by channel id`, loadedPublicMesages)
      this.receivedPublicMessages.push(...loadedPublicMesages)
    })


    //load private messages
    this.privateConversationMessages$ = this.privateConversationId$.pipe(
      filter(conversationId => conversationId !== undefined),
      switchMap(conversationId => this.messageService.loadPrivateMessages(this.currentUserId, conversationId as number)),
      map((loadedPrivateMessages) => loadedPrivateMessages.map((message: any) => ({
        senderId: message.sentFromUserId,
        message: message.body
      })))
    )


    //load public channels
    this.channelService.getListOfChannels().subscribe(loadAllChannels => {
      this.loadedPublicChannels.push(...loadAllChannels)
      console.log(loadAllChannels);
    })



    // load private conversation users
    this.privateConversationUsers$ = this.privateConversationId$.pipe(
      filter(conversationId => conversationId !== undefined),
      mergeMap(conversationId => {
        //ngRx implementation
        this.store.dispatch(Users.Api.Actions.loadUserByIdStarted({ userId: conversationId as number }))
        const targetedConversationUser$ = this.store.select(selectUserById).pipe(
          rxjs.map(users =>  users.find(user => user.id == conversationId) )
        )

        this.store.dispatch(Users.Api.Actions.loadUserByIdStarted({ userId: this.authService.extractUserId() as number }))
        const currentUser$ = this.store.select(selectUserById).pipe(
          rxjs.map(users =>  users.find(user => user.id == this.authService.extractUserId() as number))
        )
      //old implementation
      //const targetedConversationUser$ = this.userService.getById(conversationId as number)
      //const currentUser$ = this.userService.getById(this.authService.extractUserId() as number)
        return forkJoin([targetedConversationUser$, currentUser$]).pipe(
          map(([targetedUser, currentUser]) => [targetedUser, currentUser])
        );
      }),
      map(([targetedUser, currentUser]) => {
        return targetedUser ? [targetedUser] : [];
      })
    )



    //combine private messages with private convesation users
    const combineLatestSubscription = combineLatest([this.privateConversationMessages$, this.privateConversationUsers$]).subscribe((result) => {

      this.receivedPrivateMessages = [];
      const privateMessages = result[0]
      const users = result[1]

      const fullMessages = privateMessages.map(privateMessage => {
        const sender = users.find(user => user.id === +privateMessage.senderId)

        return {
          isSeen: privateMessage.isSeen,
          message: privateMessage.message,
          senderId: sender?.firstName ?? ''
        }
      })

      this.receivedPrivateMessages.push(...fullMessages)
    })




    //receive private messages
    const receivedPrivateMessagesSubscription = this.messageService.receivePrivateMesages()
      .pipe(withLatestFrom(this.privateConversationUsers$))
      .subscribe(([loadedPrivateMessages, users]) => {
        const sender = users.find(user => user.id === +loadedPrivateMessages.senderId)



        this.receivedPrivateMessages.push({
          isSeen: loadedPrivateMessages.isSeen,
          message: loadedPrivateMessages.message,
          senderId: sender?.firstName ?? ''
        });
        console.log(loadedPrivateMessages);
      })


  }

  ngOnDestroy(): void {

  }


  //token logic

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  extractUserId(): number | null {

    const accessToken = this.accessToken;
    if (accessToken) {
      const decodedToken = this.jwtHelper.decodeToken(accessToken);
      return decodedToken ? +decodedToken.userId : null;
    }
    return null;
  }

  logout() {
    this.authService.logout();
  }

  public tempMessage: string | undefined = undefined
  public onPrivateMessageChangeHandler($event: any): void {
    this.tempMessage = $event.target.value
  }


  public conversationIdSelectedClickHandler(conversationId: number): void {

    //reset privateConversationId$ ???
    console.log(this.receivedPrivateMessages);
    this.privateConversationId$.next(conversationId);

  }

  public channelIdSelectedClickHandler(channelId: number): void {

    const selectedChannel = this.SelectedChannel$.getValue();
    //console.log("selectedchannel:", selectedChannel);

    this.SelectedChannel$.next(channelId);



  }

  createChannel() {
    if (this.channelName !== undefined && this.channelType !== null && this.currentUserId !== null) {
      this.channelService.createNewChannel(this.channelName, this.channelType, this.currentUserId).subscribe(newChannel => {

        
      })
      console.log("channel name:", this.channelName)
      console.log("channel type", this.channelType)
      console.log("currentUserId:", this.currentUserId)
      this.channelName = "";
    }


  }
}
