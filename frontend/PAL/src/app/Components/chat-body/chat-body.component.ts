import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ChatService, PrivateMessage } from '../../Services/chat.service';
import { MessageService } from '../../Services/message.service';
import { User, UserService } from '../../Services/user.service';
import * as rxjs from 'rxjs';
import { AuthService } from '../../Services/auth.service';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';


@Component({
  selector: 'app-chat-body',
  templateUrl: './chat-body.component.html',
  styleUrl: './chat-body.component.css'
})
export class ChatBodyComponent implements OnInit,OnDestroy {
  
  @ViewChild('chatBodyContainer') chatBodyContainer!: ElementRef<HTMLElement>;
  @ViewChild(CdkVirtualScrollViewport) virtualScrollViewport!: CdkVirtualScrollViewport;
  @ViewChild(CdkVirtualScrollViewport) virtualScrollViewportPublic!: CdkVirtualScrollViewport;

  private destroy$ = new rxjs.Subject<void>();

  //seen properties
  currentlyTypingUsers = this.chatService.currentlyTypingUsers$
  senderId$ = new rxjs.BehaviorSubject<number | undefined>(0);
  isUserTyping$ = new rxjs.BehaviorSubject<boolean>(false)
  typingStatusMap = new Map<number, string>()
  receivedPrivateMessages$ = this.messageService.receivedPrivateMessages$;
  privateConversationUsers$!: rxjs.Observable<User[]>;
  
  //scroll properties
  scrollIndexPublic$ = this.messageService.virtualScrollViewportPublic$
  scrollIndexPrivate$ = this.messageService.virtualScrollViewportPrivate$

  constructor(
    public chatService: ChatService,
    public messageService: MessageService,
    public userService: UserService,
    private authService:AuthService
  ) {


   }


  ngOnInit(): void {
    //testing 
 
   //scroll after sending a private message
   this.messageService.endScrollValue$.pipe(rxjs.takeUntil(this.destroy$)).subscribe(res => {
    if(res !== 0)
    this.scrollToEndPrivate(res+1)
   })

    //scroll after sending a public message
    this.messageService.endScrollValue$.pipe(rxjs.takeUntil(this.destroy$)).subscribe(res => {
     // console.log(`endScrollValue$ from chatbody onInit-`,res)
      if (res !== 0)
        setTimeout(() => {
          this.scrollToEndPublic(res)
        }, 11);
        
    })


   //scroll after loading more public messages
   //enclosing if might create a problem, need to investigate it further.
    if (this.scrollIndexPublic$.value !== 3) {
      this.scrollIndexPublic$.pipe(rxjs.takeUntil(this.destroy$)).subscribe(res => {

        if (res !== undefined && res !== null && res !== 0) {
          //console.log(res)
          this.virtualScrollViewportPublic.scrollToIndex(res)
        }
      })
    }

   //scroll after loading more private messages
    if (this.scrollIndexPrivate$.value !== 3) {
      this.scrollIndexPrivate$.pipe(rxjs.takeUntil(this.destroy$)).subscribe(res => {

        if (res !== undefined && res !== null && res !== 0) {
          // console.log(res)
          this.virtualScrollViewport.scrollToIndex(res)
        }
      })
    }

    //is typing logic
    this.chatService.receiveTypingStatus()
      .pipe(
        
        rxjs.takeUntil(this.destroy$),

      )
      .subscribe(res => {

        this.chatService.senderId$.next(res.senderId)
        this.chatService.isUserTyping$.next(res.isTyping)
        this.chatService.currentlyTypingUsers$.next(res.currentlyTypingList)
      //  console.log(`receive:`,this.chatService.currentlyTypingUsers$.value)
        //this.typingStatusMap.clear();

        // get user details for each senderId
       

        //investigate what happens with senderId through the flow
        res.currentlyTypingList.forEach((senderId: number) => {
          this.userService.getById(senderId).pipe(
            rxjs.switchMap((user) => {
              if (user) {
                const firstName = user.firstName;
                
 
               // console.log(`receive:this runs`)
              
                const currentMap = this.typingStatusMap.set(senderId,firstName)
              
                this.chatService.typingStatusMap$.next(currentMap)
               // console.log(`receive:this runs + typingStatusMap$.value`, this.chatService.typingStatusMap$.getValue())
  
              } else {
                console.error(`User with senderId ${senderId} not found.`);
              }
              return rxjs.of(null);
            }),
            rxjs.takeUntil(this.destroy$)
          ).subscribe();
        });

      })

      this.privateConversationUsers$ = rxjs.combineLatest([this.chatService.privateConversationId$, this.authService.userId$, this.userService.allUsers$]).pipe(
        rxjs.filter(([privateConversationId, userId]) => {
          return privateConversationId != undefined && userId != undefined
        }),
        rxjs.map(([privateConversationId, userId, allUsers]) => {
          return allUsers.filter(user => [privateConversationId, userId].includes(user.id))
        })
      )
  
      this.privateConversationUsers$.pipe(rxjs.takeUntil(this.destroy$)).subscribe(res => {
  
      })


      //receive private messages ###problem with the multicasting of private messages is here
    this.messageService.receivePrivateMesages()
    .pipe(
      rxjs.withLatestFrom(this.privateConversationUsers$),
      rxjs.takeUntil(this.destroy$)
    )
    .subscribe(([loadedPrivateMessages, users]) => {
      const sender = users.find(user => user.id === +loadedPrivateMessages.senderId)
      

      if (sender !== undefined) {
        const newPrivateMessage: PrivateMessage = {
          isSeen: loadedPrivateMessages.isSeen,
          message: loadedPrivateMessages.message,
          senderId: sender?.firstName ?? '1'
        }

        //pop the first private message out of the BS[]
        if (this.messageService.receivedPrivateMessages$.value.length >= this.messageService.initialPrivateMessageStartIndex$.value) {
          this.messageService.receivedPrivateMessages$.value.shift()
        }
        //push the next one in
        this.messageService.receivedPrivateMessages$.next([...this.receivedPrivateMessages$.value, newPrivateMessage])
      
      }
          //set virtualScrollViewport to message service
    
      this.messageService.setVirtualScrollViewport(this.virtualScrollViewport);
      this.messageService.scrollToEndPrivate(this.messageService.endScrollValue$.value)

    })

  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  privateAutoScroll(event: any): void {

    if (event == 0) {
      this.messageService.loadMorePrivateMessages()

    }
  }

  publicAutoScroll(event: any): void {
    //console.log(`scroll value:`,event)
    if (event == 0) {
      this.messageService.loadMorePublicMessages()

    }
  }

  scrollToEndPrivate(index: number): void {
   
    this.virtualScrollViewport.scrollToIndex(index)
  
  }

  scrollToEndPublic(index: number): void {
    
    this.virtualScrollViewportPublic.scrollToIndex(index)
    console.log('Scrolled to index:', index);

  }
}
