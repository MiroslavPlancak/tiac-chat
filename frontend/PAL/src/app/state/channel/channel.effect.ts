import { Injectable, inject } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Channels } from "../../state/channel/channel.action"
import { ChannelService } from "../../Services/channel.service";
import { Store } from "@ngrx/store";
import { ConnectionService } from "../../Services/connection.service";
import * as rxjs from 'rxjs';

@Injectable()

export class ChannelEffect {

    private channelService = inject(ChannelService)
    private connectionService = inject(ConnectionService)
    private action$ = inject(Actions)
    private store = inject(Store)

    /// API calls ///
    loadAllChannels$ = createEffect(() =>
        this.action$.pipe(
            ofType(Channels.Api.Actions.loadAllChannelsStarted),
            rxjs.switchMap(() =>
                this.channelService.getListOfChannels().pipe(
                    //rxjs.tap((res) => console.log(`effect output:`, res)),
                    rxjs.map((result) => Channels.Api.Actions.loadAllChannelsSucceeded({ channels: result })),
                    rxjs.catchError((error) => rxjs.of(Channels.Api.Actions.loadAllChannelsFailed({ error: error })))
                )
            )
        )
    )

    loadPrivateChannelsByUserId$ = createEffect(() =>
        this.action$.pipe(
            ofType(Channels.Api.Actions.loadPrivateChannelsByUserIdStarted),
            rxjs.switchMap((action) =>
                this.channelService.getListOfPrivateChannelsByUserId(action.userId).pipe(
                    rxjs.map((response) => Channels.Api.Actions.loadPrivateChannelsByUserIdSucceeded({ privateChannels: response })),
                    rxjs.catchError((error) => rxjs.of(Channels.Api.Actions.loadPrivateChannelsByUserIdFailed({ error: error })))
                )
            )
        )
    )

    loadPrivateChannelById$ = createEffect(() =>
        this.action$.pipe(
            ofType(Channels.Api.Actions.loadPrivateChannelByIdStarted),
            rxjs.switchMap((action) => {
                return rxjs.of(Channels.Api.Actions.loadPrivateChannelByIdSucceeded({ channelId: action.channelId }))
            })
        )
    )

    loadUserChannelsByUserId$ = createEffect(() =>
        this.action$.pipe(
            ofType(Channels.Api.Actions.loadUserChannelByUserIdStarted),
            rxjs.switchMap((action) =>
                this.channelService.getAllUserChannelsByUserId(action.userId).pipe(
                    rxjs.map((response) => Channels.Api.Actions.loadUserChannelByUserIdSucceeded({ userChannels: response })),
                    rxjs.catchError((error) => rxjs.of(Channels.Api.Actions.loadUserChannelByUserIdFailed({ error: error })))
                )
            )
        )
    )

    /// Hub calls ///

    addUserToPrivateChannel$ = createEffect(()=>
        this.action$.pipe(
            ofType(Channels.Hub.Actions.addUserToPrivateChannelStarted),
            rxjs.switchMap((action) =>
                rxjs.of(action.privateChannel).pipe(
                    rxjs.map((channel)=> Channels.Hub.Actions.addUserToPrivateChannelSucceeded({ channelId:channel.id })),
                    rxjs.catchError((error) => rxjs.of(Channels.Hub.Actions.addUserToPrivateChannelFailed({ error: error })))
                )
            )
        )
    )

    removeUserFromPrivateChannel$ = createEffect(() =>
        this.action$.pipe(
            ofType(Channels.Hub.Actions.removeUserFromPrivateChannelStarted),
            rxjs.switchMap((action) =>
                rxjs.of(action.privateChannelId).pipe(
                    rxjs.map((channelId) => Channels.Hub.Actions.removeUserFromPrivateChannelSucceeded({ privateChannelId: channelId })),
                    rxjs.catchError((error) => rxjs.of(Channels.Hub.Actions.removeUserFromPrivateChannelFailed({ error: error })))
                )
            )
        )
    )

    addNewPrivateChannel$ = createEffect(()=>
        this.action$.pipe(
            ofType(Channels.Hub.Actions.addNewPrivateChannelStarted),
            rxjs.switchMap((action) =>
                rxjs.of(action.newPrivateChannel).pipe(
                    rxjs.tap((res)=> console.log(`effect:`,res)),
                    rxjs.map((newPrivateChannel) => Channels.Hub.Actions.addNewPrivateChannelSucceeded({ newPrivateChannel: newPrivateChannel})),
                    rxjs.catchError((error) => rxjs.of(Channels.Hub.Actions.addNewPrivateChannelFailed({ error: error })))
                )
            )
        )
    )
}