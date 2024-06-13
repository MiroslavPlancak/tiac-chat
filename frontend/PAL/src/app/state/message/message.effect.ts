import { Injectable, inject } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Messages } from "./message.action"
import * as rxjs from 'rxjs';
import { MessageService } from "../../Services/message.service";
import { ChatService } from "../../Services/chat.service";
import { Store } from "@ngrx/store";
import { selectCurrentUser } from "../user/user.selector";
import { selectCurrentlyClickedPrivateConversation, selectCurrentlyClickedPublicConversation, selectCurrentlyLoggedUser } from "../channel/channel.selector";

@Injectable()

export class MessageEffects {

    private messageService = inject(MessageService)
    private chatService = inject(ChatService)
    private store = inject(Store)
    private action$ = inject(Actions)


    /// API calls /// 

    //load paginated private messages
    loadPaginatedPrivateMessages$ = createEffect(() =>
        this.action$.pipe(
            ofType(Messages.Api.Actions.loadPaginatedPrivateMessagesStarted),
         
            rxjs.concatMap((action) =>{
          console.log(`effect pre-RESULT`,action)
             return   this.messageService.loadPaginatedPrivateMessages(action.senderId, action.receiverId, action.startIndex, action.endIndex).pipe(
              
                   rxjs.tap((res)=> console.log(`effect:`, res)),
                    rxjs.map((response) => Messages.Api.Actions.loadPaginatedPrivateMessagesSucceeded({ receiverId: action.receiverId, privateMessages: response })),
                    rxjs.catchError((error) => rxjs.of(Messages.Api.Actions.loadPaginatedPrivateMessagesFailed({ error: error })))
                )}
            )
        )
    )

    //clear paginated private messages
    clearPaginatedPrivateMessages$ = createEffect(() =>
        this.action$.pipe(
            ofType(Messages.Api.Actions.clearPaginatedPrivateMessagesStarted),
            rxjs.switchMap((action) => {
                return rxjs.of(action.userId).pipe(
                    // rxjs.tap((res)=> console.log(`effect :`,res)),
                    rxjs.map((result) => Messages.Api.Actions.clearPaginatedPrivateMessagesSucceeded({ userId: result })),
                    rxjs.catchError((error) => rxjs.of(Messages.Api.Actions.clearPaginatedPrivateMessagesFailed({ error: error })))
                )
            })
        )
    )

    //load paginated public messages
    loadPaginatedPublicMessages$ = createEffect(()=>
        this.action$.pipe(
            ofType(Messages.Api.Actions.loadPaginatedPublicMessagesStarted),
            //changed this to concatMap() from switchMap() for the purposes of waiting messages to properly load
            rxjs.concatMap((action)=>
                this.messageService.loadPaginatedPublicMessagesById(action.channelId, action.startIndex, action.endIndex).pipe(
                    rxjs.map((response) => Messages.Api.Actions.loadPaginatedPublicMessagesSucceeded({ channelId: action.channelId, publicMessages:response})),
                    rxjs.catchError((error) => rxjs.of(Messages.Api.Actions.loadPaginatedPublicMessagesFailed({ error: error })))
                )
            )
        )
    )

    //clear paginated private messages
    clearPaginatedPublicMessages$ = createEffect(() =>
        this.action$.pipe(
            ofType(Messages.Api.Actions.clearPaginatedPublicMessagesStarted),
            rxjs.switchMap((action) => {
                return rxjs.of(action.channelId).pipe(
                    // rxjs.tap((res)=> console.log(`effect :`,res)),
                    rxjs.map((result) => Messages.Api.Actions.clearPaginatedPublicMessagesSucceeded({ channelId: result })),
                    rxjs.catchError((error) => rxjs.of(Messages.Api.Actions.clearPaginatedPublicMessagesFailed({ error: error })))
                )
            })
        )
    )

    /// HUB calls /// 

    loadPrivateMessage$ = createEffect(() =>
        this.action$.pipe(
            ofType(Messages.Hub.Actions.sendPrivateMessageStarted),
            rxjs.concatMap((actions) => {
                return this.messageService.sendPrivateMessage(actions.privateMessage.sentToUser, actions.privateMessage.body).pipe(
                    rxjs.map(() => Messages.Hub.Actions.sendPrivateMessageSucceeded({ privateMessage: actions.privateMessage, receiverId: actions.receiverId })),
                    rxjs.catchError((error) => rxjs.of(Messages.Hub.Actions.sendPrivateMessageFailed({ error: error })))
                )
            })
        )
    )

    loadPublicMessage$ = createEffect(() =>
        this.action$.pipe(
            ofType(Messages.Hub.Actions.sendPublicMessageStarted),
           // rxjs.tap(action => console.log('Action dispatched:', action)), // Add this line to log the action
            rxjs.withLatestFrom(this.store.select(selectCurrentUser)),
            rxjs.concatMap(([actions, user]) => {
                //console.log(`actions:`, actions)
                return this.messageService.sendMessage(actions.senderId, actions.publicMessage, actions.channelId).pipe(
                  //  rxjs.tap(response => console.log(`tap/effect response:`, response)), // Add this line to log the response
                    rxjs.map(() => Messages.Hub.Actions.sendPublicMessageSucceeded({
                        senderId: actions.senderId,
                        publicMessage: actions.publicMessage,
                        channelId: actions.channelId,
                        user:user
                    })),
                    rxjs.catchError((error) => rxjs.of(Messages.Hub.Actions.sendPublicMessageFailed({ error: error })))
                )
            })
        )
    )

    receivePrivateMessage$ = createEffect(() =>
        this.action$.pipe(
            ofType(Messages.Hub.Actions.receivePrivateMessageStarted),
            rxjs.switchMap((action) =>{
             //   console.log(`effect:0`, action.privateMessage)
                return rxjs.of(action).pipe(
                 // rxjs.tap((res) => console.log(`receive private message started / effect:`, res)),
                    rxjs.map(()=> Messages.Hub.Actions.receivePrivateMessageSucceeded({ privateMessage: action.privateMessage, senderId: action.senderId})),
                    rxjs.catchError((error) => rxjs.of(Messages.Hub.Actions.receivePrivateMessageFailed({ error: error })))
                )
            })
        )
    )

    receivePublicMessage$ = createEffect(() =>
        this.action$.pipe(
            ofType(Messages.Hub.Actions.receivePublicMessageStarted),
            rxjs.switchMap((action) =>{
              //  console.log(`effect:0`, action.channelId )
                return rxjs.of(action).pipe(
                 //   rxjs.tap((res) => console.log(`effect:`, res)),
                    rxjs.map(()=> Messages.Hub.Actions.receivePublicMessageSucceeded({ publicMessage: action.publicMessage, channelId: action.channelId})),
                    rxjs.catchError((error) => rxjs.of(Messages.Hub.Actions.receivePublicMessageFailed({ error: error })))
                )
            })
        )
    )
    receivePrivateMessageClickSeen$ = createEffect(() =>
        this.action$.pipe(
            ofType(Messages.Hub.Actions.receivePrivateMessageClickConversationStarted),
            rxjs.switchMap((action) => {
                return rxjs.of(action).pipe(
                    rxjs.map(() => Messages.Hub.Actions.receivePrivateMessageClickConversationSucceeded({
                        receiverId: action.receiverId,
                        messageId: action.messageId,
                        isSeen: action.isSeen
                    })),
                    rxjs.catchError((error) => rxjs.of(Messages.Hub.Actions.receivePrivateMessageClickConversationFailed({ error: error })))
                )
            })
        )
    )

    sendIsTypingStatus$ = createEffect(()=>
        this.action$.pipe(
            ofType(Messages.Hub.Actions.sendIsTypingStatusStarted),
            rxjs.withLatestFrom(this.store.select(selectCurrentUser)),
            rxjs.switchMap(([action,user])=>{
                return this.chatService.sendTypingStatus(action.isTyping, action.senderId, action.receiverId).pipe(
                    rxjs.map(() => Messages.Hub.Actions.sendIsTypingStatusSucceeded({ 
                         isTyping: action.isTyping,
                         senderId: action.senderId, 
                         user:user
                        })),
                    rxjs.catchError((error) => rxjs.of(Messages.Hub.Actions.sendIsTypingStatusFailed({ error: error })))
                )
            })
        )
    )

    receiveTypingStatus$ = createEffect(() =>
        this.action$.pipe(
            ofType(Messages.Hub.Actions.receiveIsTypingStatusStarted),
            rxjs.switchMap((action) => {
                return this.chatService.receiveTypingStatus().pipe(
                    rxjs.map((response) => Messages.Hub.Actions.receiveIsTypingStatusSucceeded({
                        isTyping:response.isTyping,
                        senderId: response.senderId,
                        typingUsers: response.currentlyTypingList
                     }),
                        rxjs.catchError((error) => rxjs.of(Messages.Hub.Actions.receiveIsTypingStatusFailed({ error: error })))
                    )
                )
            })
        )
    )

    requestLastestNumberOfPublicMessagesByChannelId$ = createEffect(() =>
        this.action$.pipe(
            ofType(Messages.Hub.Actions.requestLatestNumberOfPublicMessagesByChannelIdStarted),
            rxjs.withLatestFrom(this.store.select(selectCurrentlyClickedPublicConversation), this.store.select(selectCurrentlyLoggedUser)),
            rxjs.switchMap(([action, channelId, currentUserId]) => {
                // Mocked response observable; replace with actual API call
                return this.chatService.getLatestNumberOfPublicChannelMessages(Number(channelId), Number(currentUserId)).pipe(
                    rxjs.map(() => Messages.Hub.Actions.requestLatestNumberOfPublicMessagesByChannelIdSuccceded()),
                    rxjs.catchError(error => rxjs.of(Messages.Hub.Actions.requestLatestNumberOfPublicMessagesByChannelIdFailed({ error })))
                );
            })
        )
    );

    receiveLastestNumberOfPublicMessagesByChannelId$ = createEffect(() =>
        this.action$.pipe(
            ofType(Messages.Hub.Actions.recieveLatestNumberOfPublicMessagesByChannelIdStarted),
            rxjs.switchMap(() => {
                return this.chatService.receiveLatestNumberOfPublicChannelMessages().pipe(
                    rxjs.take(1), 
                    rxjs.map((response) => Messages.Hub.Actions.recieveLatestNumberOfPublicMessagesByChannelIdSuccceded({ 
                        channelId: response.channelId, 
                        totalPublicMessages: response.numberOfPublicMessages
                     })),
                    rxjs.catchError((error) => rxjs.of(Messages.Hub.Actions.recieveLatestNumberOfPublicMessagesByChannelIdFailed({ error: error })))
                )
            })
        )
    )
    //uncomment take(1) for better performance (needs further testing)
    requestLatestNumberOfPrivateMessagesByReceiverId$ = createEffect(() =>
        this.action$.pipe(
            ofType(Messages.Hub.Actions.requestLatestNumberOfPrivateMessagesByReceiverIdStarted),
            rxjs.withLatestFrom(this.store.select(selectCurrentlyLoggedUser), this.store.select(selectCurrentlyClickedPrivateConversation)),
           // rxjs.take(1),
            rxjs.switchMap(([action, currentUserId, receiverId]) => {
                return this.chatService.getLatestNumberOfPrivateMessages(Number(currentUserId), Number(receiverId)).pipe(
                   //rxjs.take(1),
                    rxjs.map(() => Messages.Hub.Actions.requestLatestNumberOfPrivateMessagesByReceiverIdSuccceded()),
                    rxjs.catchError((error) => rxjs.of(Messages.Hub.Actions.requestLatestNumberOfPrivateMessagesByReceiverIdFailed({ error: error })))
                )
            })
        )
    )

    receiveLatestNumberOfPrivateMessagesByReceiverId$ = createEffect(() =>
        this.action$.pipe(
            ofType(Messages.Hub.Actions.recieveLatestNumberOfPrivateMessagesByReceiverIdStarted),
            rxjs.take(1), 
            rxjs.switchMap(() => {
                return this.chatService.receiveLatestNumberOfPrivateMessages().pipe(
                    // rxjs.take(1),
                    // rxjs.tap((res) => console.log(`tap:`,res)),
                   
                    rxjs.map((response) => Messages.Hub.Actions.recieveLatestNumberOfPrivateMessagesByReceiverIdSuccceded({
                        receiverId: Number(response.receiverId),
                        totalPrivateMessages: response.numberOfPrivateMessages
                    })),
                    rxjs.catchError((error) => rxjs.of(Messages.Hub.Actions.recieveLatestNumberOfPrivateMessagesByReceiverIdFailed({ error: error })))
                )
            })
        )
    )
      /// FLAG calls /// 
    setCanLoadMorePublicMessagesFlag$ = createEffect(() =>
        this.action$.pipe(
            ofType(Messages.Flag.Actions.setCanLoadMorePublicMessagesFlagStarted),
            rxjs.take(1),
            rxjs.switchMap((action) =>
                rxjs.of(action.canLoadMore).pipe(
                   
                    rxjs.map((response) => Messages.Flag.Actions.setCanLoadMorePublicMessagesFlagSucceeded({ canLoadMore: response })),
                    rxjs.catchError((error) => rxjs.of(Messages.Flag.Actions.setCanLoadMorePublicMessagesFlagFailed({ error: error })))
                )
            )
        )
    )

    setCanLoadMorePrivateMessagesFlag$ = createEffect(() =>
        this.action$.pipe(
            ofType(Messages.Flag.Actions.setCanLoadMorePrivateMessagesFlagStarted),
            //rxjs.take(1),
            rxjs.switchMap((action) =>
                rxjs.of(action.canLoadMore).pipe(
                   
                    rxjs.map((response) => Messages.Flag.Actions.setCanLoadMorePrivateMessagesFlagSucceeded({ canLoadMore: response })),
                    rxjs.catchError((error) => rxjs.of(Messages.Flag.Actions.setCanLoadMorePrivateMessagesFlagFailed({ error: error })))
                )
            )
        )
    )

    setPrivateStartEndIndexFlag$ = createEffect(() =>
        this.action$.pipe(
            ofType(Messages.Flag.Actions.setPrivateStartEndIndexFlagStarted),
            rxjs.switchMap((actions) => {
                return rxjs.of(actions).pipe(
                    // rxjs.tap((res)=>console.log(`effect test:`, res)),
                    rxjs.map(() => Messages.Flag.Actions.setPrivateStartEndIndexFlagSucceeded({ startIndex: actions.startIndex, endIndex: actions.endIndex })),
                    rxjs.catchError((error) => rxjs.of(Messages.Flag.Actions.setPrivateStartEndIndexFlagFailed({ error: error })))
                )
            })
        )
    )

    resetPrivateStartEndIndexFlag$ = createEffect(()=>
        this.action$.pipe(
            ofType(Messages.Flag.Actions.resetPrivateStartEndIndexFlagStarted),
            rxjs.switchMap((actions) => {
                return rxjs.of(actions).pipe(
                    // rxjs.tap(()=>console.log('does this happen?')),
                    rxjs.map(()=> Messages.Flag.Actions.resetPrivateStartEndIndexFlagSucceeded()),
                    rxjs.catchError((error) => rxjs.of(Messages.Flag.Actions.resetPrivateStartEndIndexFlagFailed({ error: error})))
                )
            })
        )
    )

    setPublicStartEndIndexFlag$ = createEffect(() =>
        this.action$.pipe(
            ofType(Messages.Flag.Actions.setPublicStartEndIndexFlagStarted),
            rxjs.switchMap((actions) => {
                return rxjs.of(actions).pipe(
                    // rxjs.tap((res)=>console.log(`effect test:`, res)),
                    rxjs.map(() => Messages.Flag.Actions.setPublicStartEndIndexFlagSucceeded({ startIndex: actions.startIndex, endIndex: actions.endIndex })),
                    rxjs.catchError((error) => rxjs.of(Messages.Flag.Actions.setPublicStartEndIndexFlagFailed({ error: error })))
                )
            })
        )
    )

    resetPublicStartEndIndexFlag$ = createEffect(() =>
        this.action$.pipe(
            ofType(Messages.Flag.Actions.resetPublicStartEndIndexFlagStarted),
            rxjs.switchMap((actions) => {
                return rxjs.of(actions).pipe(
                    // rxjs.tap(()=>console.log('does this happen?')),
                    rxjs.map(() => Messages.Flag.Actions.resetPublicStartEndIndexFlagSucceeded()),
                    rxjs.catchError((error) => rxjs.of(Messages.Flag.Actions.resetPublicStartEndIndexFlagFailed({ error: error })))
                )
            })
        )
    )

    setPrivateInitialLoadingAutoScrollValue$ = createEffect(()=>
        this.action$.pipe(
            ofType(Messages.Flag.Actions.setPrivateInitialLoadingAutoScrollValueStarted),
            rxjs.switchMap((actions) =>{
                return rxjs.of(actions).pipe(
                    rxjs.take(1),
                    // rxjs.tap((res) => console.log(`effect XX:`, res.autoScrollValue)),
                    rxjs.map(() => Messages.Flag.Actions.setPrivateInitialLoadingAutoScrollValueSucceeded({ autoScrollValue: actions.autoScrollValue})),
                    rxjs.catchError((error) => rxjs.of(Messages.Flag.Actions.setPrivateInitialLoadingAutoScrollValueFailed({ error: error })))
                )
            })
        )
    )

    setPublicInitialLoadingAutoScrollValue$ = createEffect(()=>
        this.action$.pipe(
            ofType(Messages.Flag.Actions.setPublicInitialLoadingAutoScrollValueStarted),
            rxjs.switchMap((actions) =>{
                return rxjs.of(actions).pipe(
                    rxjs.take(1),
                    // rxjs.tap((res) => console.log(`effect XX:`, res.autoScrollValue)),
                    rxjs.map(() => Messages.Flag.Actions.setPublicInitialLoadingAutoScrollValueSucceeded({ autoScrollValue: actions.autoScrollValue})),
                    rxjs.catchError((error) => rxjs.of(Messages.Flag.Actions.setPublicInitialLoadingAutoScrollValueFailed({ error: error })))
                )
            })
        )
    )
}