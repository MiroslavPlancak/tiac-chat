import { Injectable, inject } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import * as rxjs from 'rxjs';
import { Users } from '../user/user.action'
import { selectAllUsers }  from '../user/user.selector'
import { UserService } from "../../Services/user.service";
import { Store } from "@ngrx/store";
import { ConnectionService } from "../../Services/connection.service";

@Injectable()

export class UserEffect {

    private userService = inject(UserService)
    private actions$ = inject(Actions)
    private store = inject(Store)

    private connectionService = inject(ConnectionService)

    loadUserById$ = createEffect(() =>
        this.actions$.pipe(
            ofType(Users.Api.Actions.loadUserByIdStarted),
            rxjs.mergeMap((action) =>
                this.userService.getById(action.userId).pipe(
                    rxjs.map((response) => Users.Api.Actions.loadUserByIdSucceeded({ user: response })),
                    rxjs.catchError((error) => rxjs.of(Users.Api.Actions.loadUserByIdFailed({ error: error })))
                )
            )
        )
    )

    loadAllUsers$ = createEffect(() =>
        this.actions$.pipe(
            ofType(Users.Api.Actions.loadAllUsersStarted),
            rxjs.switchMap(() =>
                this.userService.getAllUsers().pipe(
                   // rxjs.tap((res) => console.log(`all users loaded:`, res)),
                    rxjs.map((response) => Users.Api.Actions.loadAllUsersSucceeded({ users: response })),
                    rxjs.catchError((error) => rxjs.of(Users.Api.Actions.loadAllUsersFailed({ error: error })))
                )
            )
        )
    )

    //load single connected user
    loadConnectedUser$ = createEffect(() =>
        this.actions$.pipe(
            ofType(Users.Hub.Actions.loadConnectedUserStarted),
            rxjs.withLatestFrom(this.loadAllUsers$),
            rxjs.switchMap(([action, allUsers]) =>
                rxjs.of(action.connectedUserId).pipe(
                    rxjs.map((userId) => Users.Hub.Actions.loadConnectedUserSucceeded({ connectedUserId: userId })),
                    rxjs.catchError((error) => rxjs.of(Users.Hub.Actions.loadConnectedUserFailed({ error: error })))
                )
            )
        )
    );
    //load all connected usesrs
    loadConnectedUsers$ = createEffect(() =>
        this.actions$.pipe(
            ofType(Users.Hub.Actions.loadConnectedUsersStarted),
            rxjs.tap(res => console.log(`[2]effect fires`, res.connectedUserIds)),
            rxjs.switchMap((action) => {
                console.log(`[3]effect fires further`, action.connectedUserIds);
                return rxjs.of(Users.Hub.Actions.loadConnectedUsersSucceeded({ connectedUserIds: action.connectedUserIds }))
            }
            ),
            rxjs.catchError(error => rxjs.of(Users.Hub.Actions.loadConnectedUsersFailed({ error })))
        )
    );
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

    private connectedUserIds$ = new rxjs.Subject<number[]>()

    constructor() {
        this.connectionService.hubConnection.on('connectedUsers', (userIds: number[]) => this.connectedUserIds$.next(userIds))
    }
    
    getUserByIdIfNeeded$ = createEffect(() => this.actions$.pipe(
        ofType(Users.Api.Actions.loadUserByIdIfNeeded),
        rxjs.withLatestFrom(this.store.select(selectAllUsers)),
        rxjs.filter(([action, users]) => users.map(user=> user.id).includes(action.userId)),
        rxjs.map(([action]) => Users.Api.Actions.loadUserByIdStarted({userId: action.userId})
    )))


    onConnectedUserIds = createEffect(() => this.connectedUserIds$.pipe(
        rxjs.map(users => Users.Hub.Actions.loadConnectedUsersSucceeded({ connectedUserIds: users}))
    ))
    
}