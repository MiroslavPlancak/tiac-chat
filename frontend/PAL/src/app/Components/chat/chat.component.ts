import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChatService, PrivateMessage } from '../../Services/chat.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AuthService } from '../../Services/auth.service';
import { User, UserService } from '../../Services/user.service';
import { BehaviorSubject, Observable, Subject, Subscription, combineLatest, distinctUntilChanged, filter, first, forkJoin, map, mergeMap, of, switchMap, withLatestFrom } from 'rxjs';
import { MessageService } from '../../Services/message.service';
import { ChannelService } from '../../Services/channel.service';


@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy {





  privateConversationId$ = new BehaviorSubject<number | undefined>(undefined)
  privateConversationUsers$!: Observable<User[]>;
  privateConversationMessages$!: Observable<PrivateMessage[]>
  private subscriptions: Subscription[] = [];


  currentUserId = -1;

  currentUserName$ = this.authService.userId$.pipe(
    filter(userId => userId != null),
    distinctUntilChanged(),
    switchMap(userid => {
      return this.userService.getById(-1);
    }),
    map(user => user.firstName)
  )

  newPublicMessage: string = '';
  newPrivateMessage: string = '';
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
    private channelService: ChannelService
  ) {
    this.channelType = this.channelTypes['public'];
  }

  ngOnInit(): void {


    // receive public messages
    this.chatService.receiveMessage().subscribe((message: any) => {

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

        const targetedConversationUser$ = this.userService.getById(conversationId as number)
        const currentUser$ = this.userService.getById(this.authService.extractUserId()as number)
        return forkJoin([targetedConversationUser$, currentUser$])
      }),

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

    //clean up
    this.subscriptions.push(combineLatestSubscription)


    //receive private messages
    const receivedPrivateMessagesSubscription = this.chatService.receivePrivateMesages()
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

    //clean up
    this.subscriptions.push(receivedPrivateMessagesSubscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
  }


  sendMessage(): void {
    const selectedChannel = this.SelectedChannel$.getValue();
    if (this.currentUserId && this.newPublicMessage && selectedChannel) {

      this.chatService.sendMessage(this.currentUserId, this.newPublicMessage, selectedChannel);

      console.log(selectedChannel)
      //clear the input for the next message
      this.newPublicMessage = '';

    }
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

  public sendPrivateMessage(): void {
    this.currentUserName$.pipe(
      first()
    ).subscribe((currentUserName) => {
      if (this.tempMessage !== undefined && this.privateConversationId$.getValue() !== undefined) {
        this.chatService.sendPrivateMessage(this.privateConversationId$.getValue(), this.tempMessage as string)
        const privateMessage: PrivateMessage = {
          isSeen: false,
          senderId: currentUserName,
          message: this.tempMessage
        }
        this.receivedPrivateMessages.push(privateMessage);

        this.tempMessage = undefined

      }
    })

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
