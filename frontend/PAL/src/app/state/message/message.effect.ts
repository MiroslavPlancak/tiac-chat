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
                   // rxjs.tap((res)=> console.log(`effect:`, res)),
                    rxjs.map((response) => Messages.Api.Actions.loadPaginatedPrivateMessagesSucceeded({ receiverId: action.receiverId,privateMessages: response })),
                    rxjs.catchError((error) => rxjs.of(Messages.Api.Actions.loadPaginatedPrivateMessagesFailed({ error: error })))
                )
            )
        )
    )

    //clear paginated private messages
    clearPaginatedPrivateMessages$ = createEffect(()=>
        this.action$.pipe(
            ofType(Messages.Api.Actions.clearPaginatedPrivateMessagesStarted),
            rxjs.switchMap((action) =>{
                return rxjs.of(action.userId).pipe(
                    rxjs.tap((res)=> console.log(`effect :`,res)),
                    rxjs.map((result) => Messages.Api.Actions.clearPaginatedPrivateMessagesSucceeded({ userId: result})),
                    rxjs.catchError((error) => rxjs.of(Messages.Api.Actions.clearPaginatedPrivateMessagesFailed({ error: error })))
                )
            })
        )
    )
}