import { Injectable, inject } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Messages } from "./message.action"
import * as rxjs from 'rxjs';
import { MessageService } from "../../Services/message.service";

@Injectable()

export class MessageEffects {

    private messageService = inject(MessageService)
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
            ofType(Messages.Hub.Actions.loadPrivateMessageStarted),
            rxjs.switchMap((actions) => {
                return this.messageService.sendPrivateMessage(actions.privateMessage.sentToUser, actions.privateMessage.body).pipe(
                    rxjs.map(() => Messages.Hub.Actions.loadPrivateMessageSucceeded({ privateMessage: actions.privateMessage, receiverId: actions.receiverId })),
                    rxjs.catchError((error) => rxjs.of(Messages.Hub.Actions.loadPrivateMessageFailed({ error: error })))
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
}