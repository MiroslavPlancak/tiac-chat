import { Injectable, inject } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import * as rxjs from 'rxjs';
import { Users } from '../user/user.action'
import { UserService } from "../../Services/user.service";

@Injectable()

export class UserEffect{

    private userService = inject(UserService)
    private actions$ = inject(Actions)

        loadUserById$ = createEffect(()=>
            this.actions$.pipe(
                ofType(Users.Api.Actions.loadUserByIdStarted),
                rxjs.mergeMap((action)=>
                    this.userService.getById(action.userId).pipe(
                        rxjs.tap((res)=> console.log(`effects output:`,res)),
                        rxjs.map((response) => Users.Api.Actions.loadUserByIdSucceeded({ user: response})),
                        rxjs.catchError((error) => rxjs.of(Users.Api.Actions.loadUserByIdFailed({ error: error})))
                    )
                )
            )
        )

        //onChannelLoadSucceeded$ = createEffect(() => this.actions$.pipe(
            // When channel data is loaded..., reqeust users for that channel.
            //ofType(Channel.Api.Actions.loadChannelById)
            // rxjs.mergeMap(channelData => {
            //    const distinctSetOfUserIds = new Set<stirng>()
            //    channelData.messages.forEach(message => {
            //      distinctSet.add(message.sentFrom)
            //      distinctSet.add(message.sentToUser)
            //    })
            //    return rxjs.from(dinstintSetofUserIds).pipe(
            //      rxjs.switchMap(userId => this.userService.getById(userId))                
            //    )
            //})
        //))
}