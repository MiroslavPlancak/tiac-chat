import { Injectable, inject } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Messages } from "./message.action"
import * as rxjs from 'rxjs';
import { MessageService } from "../../Services/message.service";
import { ChatService } from "../../Services/chat.service";
import { Store } from "@ngrx/store";
import { selectCurrentUser } from "../user/user.selector";

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
            rxjs.switchMap((action) =>
                this.messageService.loadPaginatedPrivateMessages(action.senderId, action.receiverId, action.startIndex, action.endIndex).pipe(
                   rxjs.tap((res)=> console.log(`effect type:`, res)),
                    rxjs.map((response) => Messages.Api.Actions.loadPaginatedPrivateMessagesSucceeded({ receiverId: action.receiverId, privateMessages: response })),
                    rxjs.catchError((error) => rxjs.of(Messages.Api.Actions.loadPaginatedPrivateMessagesFailed({ error: error })))
                )
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
            rxjs.switchMap((action)=>
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
            rxjs.switchMap((actions) => {
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
            rxjs.tap(action => console.log('Action dispatched:', action)), // Add this line to log the action
            rxjs.withLatestFrom(this.store.select(selectCurrentUser)),
            rxjs.switchMap(([actions, user]) => {
                console.log(`actions:`, actions)
                return this.messageService.sendMessage(actions.senderId, actions.publicMessage, actions.channelId).pipe(
                    rxjs.tap(response => console.log(`tap/effect response:`, response)), // Add this line to log the response
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
                console.log(`effect:0`, action.privateMessage)
                return rxjs.of(action).pipe(
                    rxjs.tap((res) => console.log(`effect:`, res)),
                    rxjs.map(()=> Messages.Hub.Actions.receivePrivateMessageSucceeded({ privateMessage: action.privateMessage, senderId: action.senderId})),
                    rxjs.catchError((error) => rxjs.of(Messages.Hub.Actions.receivePrivateMessageFailed({ error: error })))
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
}